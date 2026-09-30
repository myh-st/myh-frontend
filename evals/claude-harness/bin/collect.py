#!/usr/bin/env python3
"""Post-run evidence collection for one or more A/B run dirs."""
import json, os, re, subprocess, sys, concurrent.futures as cf
ROOT = '/tmp/claude-0/evalrun'
AB = os.environ.get('AB_OUT', f'{ROOT}/ab')
EV = os.environ.get('EV_OUT', f'{ROOT}/evidence')
ROUTES = {
    'hospital-operations': {'primary': '/alerts', 'detail': '/alerts/AL-2041'},
    'banking-risk-console': {'primary': '/alerts', 'detail': '/cases/CASE-3102'},
    'devops-control-plane': {'primary': '/incidents', 'detail': '/incidents/INC-4821', 'extra': ['/services']},
    'hr-onboarding': {'primary': '/hires', 'detail': '/hires/H-1001', 'extra': ['/manager']},
    'retail-analytics': {'primary': '/', 'detail': '/stores/st-101'},
    'ai-agent-workspace': {'primary': '/', 'detail': '/c/c-102'},
    'connector-marketplace': {'primary': '/connectors', 'detail': '/connectors/conn-02'},
    'government-service-portal': {'primary': '/cases', 'detail': '/cases/BKK-2569-004213', 'extra': ['/cases/BKK-2569-004213/audit']},
}

def sh(cmd, cwd, timeout=600):
    try:
        p = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr)
    except subprocess.TimeoutExpired:
        return 124, 'TIMEOUT'

def tail(s, n=12):
    return '\n'.join([l for l in s.strip().splitlines() if 'Future Flag' not in l][-n:])

def collect(run):
    case = re.sub(r'-(control|myh)$', '', run)
    d = f'{AB}/{run}'; out = f'{EV}/{run}'
    os.makedirs(out, exist_ok=True)
    res = {'run': run, 'case': case}
    sh('pnpm install --offline --silent', d)
    checks = {}
    for c in ('lint', 'typecheck', 'test', 'build'):
        rc, o = sh(f'pnpm run {c}', d)
        checks[c] = {'exit': rc, 'tail': tail(o)}
    res['checks'] = checks
    sh('git add -A', d)
    excl = "-- . ':(exclude).claude' ':(exclude)pnpm-lock.yaml' ':(exclude)dist' ':(exclude)*.tsbuildinfo'"
    _, stat = sh(f'git diff --cached --stat HEAD {excl}', d)
    _, names = sh(f'git diff --cached --name-status HEAD {excl}', d)
    _, patch = sh(f'git diff --cached HEAD {excl}', d)
    open(f'{out}/diff.patch', 'w').write(patch)
    res['diffstat'] = stat.strip().splitlines()[-1] if stat.strip() else 'no changes'
    res['files'] = names.strip().splitlines()
    res['contract_files_changed'] = [l for l in res['files'] if re.search(r'\tsrc/(api|mock)/', l)]
    res['existing_tests_changed'] = [l for l in res['files'] if re.search(r'\tsrc/(App\.test\.tsx|api/client\.test\.ts)$', l)]
    _, orig_test = sh('git show HEAD:src/App.test.tsx', d)
    sels = sorted(set(re.findall(r"TestId\('([^']+)'", orig_test)))
    _, src_now = sh("grep -rhoE 'data-testid=[\"{][^\"}]+' src --include=*.tsx --exclude=*.test.tsx || true", d)
    _, src_all = sh("find src -name '*.tsx' ! -name '*.test.tsx' -exec cat {} +", d)
    def present(sel):
        if f'"{sel}"' in src_all or f"'{sel}'" in src_all or f'`{sel}`' in src_all: return True
        pre = sel.rsplit('-', 1)[0] + '-${'
        return '-' in sel and pre in src_all
    res['original_test_selectors'] = {s: present(s) for s in sels}
    _, pkg_diff = sh('git diff --cached HEAD -- package.json', d)
    res['package_json_diff'] = [l for l in pkg_diff.splitlines() if l.startswith(('+ ', '- ', '+\t', '-\t')) or re.match(r'^[+-]\s+"', l)]
    signals = {}
    for k, pat in {
        'prefers_reduced_motion': 'prefers-reduced-motion', 'focus_visible': 'focus-visible', 'aria_live': 'aria-live',
        'role_status_alert': 'role="(status|alert)"', 'dialog': '<dialog|role="dialog"|role="alertdialog"',
        'transition_all': 'transition: all|transition:all', 'emoji_ui': '[\\x{1F300}-\\x{1FAFF}]', 'media_queries': '@media',
        'lang_th': 'lang="th"|lang=\\{', 'aria_sort_or_caption': 'aria-sort|<caption', 'mutation_confirm': 'window.confirm|confirm\\(',
    }.items():
        _, o = sh(f"grep -rPc '{pat}' src 2>/dev/null | awk -F: '{{s+=$2}} END {{print s+0}}'", d)
        signals[k] = int(o.strip() or 0)
    res['source_signals'] = signals
    _, loc = sh("find src -name '*.ts' -o -name '*.tsx' -o -name '*.css' | grep -v '^src/mock\\|^src/api' | xargs wc -l | tail -1", d)
    res['frontend_loc'] = loc.strip()
    _, tcount = sh("grep -rE '^\\s*(it|test)\\(' src --include=*.test.tsx --include=*.test.ts | wc -l", d)
    res['test_cases'] = int(tcount.strip() or 0)
    if checks['build']['exit'] == 0:
        rc, o = sh(f"node {ROOT}/tools/verify.js {d} {out} '{json.dumps(ROUTES[case])}'", f'{ROOT}/tools', timeout=900)
        res['verify_exit'] = rc
    else:
        res['verify_exit'] = 'skipped: build failed'
    meta_p = f'{AB}/{run}.meta.json'
    if os.path.exists(meta_p):
        res['session'] = json.load(open(meta_p))
    json.dump(res, open(f'{out}/collect.json', 'w'), indent=1)
    return res

if __name__ == '__main__':
    runs = sys.argv[1:]
    with cf.ThreadPoolExecutor(int(os.environ.get('PAR', '2'))) as ex:
        for r in ex.map(collect, runs):
            print(r['run'], {k: v['exit'] for k, v in r['checks'].items()}, r['diffstat'], 'contract:', r['contract_files_changed'], flush=True)
