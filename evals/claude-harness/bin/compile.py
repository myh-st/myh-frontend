#!/usr/bin/env python3
"""Unblind scores, write per-run result JSONs, run score.py, aggregate summary.
usage: compile.py <phase-tag> <results_dir> <packets_dir> <evidence_dir> <map.json> [cases...]"""
import json, os, re, subprocess, sys, statistics
from PIL import Image
REPO = '/home/user/myh-frontend'
DIMS = ['task_hierarchy', 'domain_adaptation', 'contract_preservation', 'interaction_state', 'responsive',
        'accessibility', 'visual_consistency', 'maintainability', 'ai_governance']
tag, RES, PK, EV, MAP = sys.argv[1:6]
cases = sys.argv[6:] or sorted(os.listdir(PK))
mapping = json.load(open(MAP))
os.makedirs(RES, exist_ok=True)

def objective(run):
    v = json.load(open(f'{EV}/{run}/verify.json')); c = json.load(open(f'{EV}/{run}/collect.json'))
    over = {p: {w: x['pageOverflowX'] for w, x in d.items()} for p, d in v['responsive'].items()}
    kb = {k: {'stops': x['stops'], 'focus_visible': x['focusVisible'], 'unnamed': x['unnamed']} for k, x in v['keyboard'].items()}
    return {
        'checks': {k: ('pass' if x['exit'] == 0 else f"fail (exit {x['exit']})") for k, x in c['checks'].items()},
        'diffstat': c['diffstat'],
        'backend_contract_files_changed': c['contract_files_changed'],
        'existing_tests_modified': c['existing_tests_changed'],
        'original_test_selectors_present': c['original_test_selectors'],
        'test_cases_total': c['test_cases'],
        'horizontal_overflow': over,
        'keyboard_tab_walk': kb,
        'reduced_motion': v['reducedMotion'],
        'axe_wcag_a_aa_violations': v['axe'],
        'non_get_requests_on_page_load': [x for l in v['loadRequests'].values() for x in l if not x.startswith('GET')],
        'scenario_live_regions': {k: x['liveRegions'] for k, x in v['scenarios'].items()},
        'source_signals': c['source_signals'],
        'console_errors': v.get('consoleErrors', [])[:5],
    }

def shots(run, case, variant):
    out = f'{RES}/screenshots/{case}'
    os.makedirs(out, exist_ok=True)
    names = []
    for w in (375, 768, 1024, 1440):
        src = f'{EV}/{run}/primary-{w}.png'
        if not os.path.exists(src): continue
        im = Image.open(src).convert('RGB')
        maxh = 2400
        if im.height > maxh: im = im.crop((0, 0, im.width, maxh))
        scale = min(1.0, 720 / im.width)
        if scale < 1: im = im.resize((int(im.width * scale), int(im.height * scale)))
        dst = f'{out}/{variant}-primary-{w}.jpg'
        im.save(dst, 'JPEG', quality=62, optimize=True)
        names.append(os.path.relpath(dst, RES))
    return names

rows = []
for case in cases:
    s = json.load(open(f'{PK}/{case}/scores.json'))
    for label, variant in mapping[case].items():
        b = s['builds'][label]
        run = f'{case}-{variant}'
        c = json.load(open(f'{EV}/{run}/collect.json'))
        sess = c.get('session', {})
        obj = objective(run)
        res = {
            'case': case, 'variant': variant,
            'agent': f"Claude Code 2.1.285 headless (claude -p), model {sess.get('model')}, effort=high (inherited CLAUDE_EFFORT)",
            'scores': {d: b['scores'][d] for d in DIMS},
            'not_applicable': b.get('not_applicable', []),
            'critical_failures': b.get('critical_failures', []),
            'evidence': {
                'skill_discovered': sess.get('skill_listed'),
                'skill_invoked': sess.get('skill_tool_invoked'),
                'tests_run': [f"pnpm {k}: {v}" for k, v in obj['checks'].items()] + [
                    'playwright: 375/768/1024/1440 overflow on primary+detail(+extra) routes',
                    'playwright: 30-step Tab walk at 1440 and 375 (primary, detail)',
                    'playwright: prefers-reduced-motion=reduce animation check', 'axe-core WCAG 2 A/AA scan',
                    'playwright: mock scenarios slow/empty/error/forbidden/partial on primary+detail',
                    'network: requests issued on page load'],
                'screenshots': shots(run, case, variant),
                'notes': s.get('comparison', ''),
            },
            'phase': tag,
            'blind_label': label,
            'scorer_rationale': b.get('rationale', {}),
            'critical_failure_evidence': b.get('critical_failure_evidence', {}),
            'overfitting': {'dominant_ia': b.get('dominant_ia'), 'justified_patterns': b.get('justified_patterns', []),
                            'suspicious_patterns': b.get('suspicious_patterns', [])},
            'states_observed': b.get('states_observed', {}),
            'strengths': b.get('notable_strengths', []), 'defects': b.get('notable_defects', []),
            'objective_checks': obj,
            'session': {k: sess.get(k) for k in ('model', 'cost_usd', 'num_turns', 'wall_seconds', 'timed_out', 'tool_counts', 'skill_file_refs')},
        }
        p = f'{RES}/{case}-{variant}.json'
        json.dump(res, open(p, 'w'), indent=1, ensure_ascii=False)
        out = subprocess.run(['python3', f'{REPO}/evals/score.py', p], capture_output=True, text=True).stdout
        score = float(re.search(r'score: ([\d.]+)', out).group(1)); verdict = re.search(r'verdict: (.*)', out).group(1).strip()
        res['score_py'] = {'score': score, 'verdict': verdict, 'stdout': out.strip()}
        json.dump(res, open(p, 'w'), indent=1, ensure_ascii=False)
        rows.append(res)

summary = {'phase': tag, 'cases': {}, 'per_dimension': {}, 'verdicts': {}}
for case in cases:
    r = {x['variant']: x for x in rows if x['case'] == case}
    if 'control' in r and 'myh' in r:
        c, m = r['control'], r['myh']
        summary['cases'][case] = {
            'control': c['score_py']['score'], 'myh': m['score_py']['score'],
            'delta': round(m['score_py']['score'] - c['score_py']['score'], 2),
            'control_verdict': c['score_py']['verdict'], 'myh_verdict': m['score_py']['verdict'],
            'improved': [d for d in DIMS if m['scores'][d] > c['scores'][d]],
            'regressed': [d for d in DIMS if m['scores'][d] < c['scores'][d]],
            'control_critical': c['critical_failures'], 'myh_critical': m['critical_failures'],
            'control_ia': c['overfitting']['dominant_ia'], 'myh_ia': m['overfitting']['dominant_ia'],
        }
    else:
        for v, x in r.items():
            summary['cases'].setdefault(case, {})[v] = x['score_py']['score']
pairs = [v for v in summary['cases'].values() if 'delta' in v]
if pairs:
    summary['mean_control'] = round(statistics.mean(p['control'] for p in pairs), 2)
    summary['mean_myh'] = round(statistics.mean(p['myh'] for p in pairs), 2)
    summary['mean_lift'] = round(statistics.mean(p['delta'] for p in pairs), 2)
    summary['median_lift'] = round(statistics.median(p['delta'] for p in pairs), 2)
    summary['cases_improved'] = sum(p['delta'] > 0 for p in pairs)
    summary['cases_regressed'] = sum(p['delta'] < 0 for p in pairs)
    for d in DIMS:
        cs = [x['scores'][d] for x in rows if x['variant'] == 'control']
        ms = [x['scores'][d] for x in rows if x['variant'] == 'myh']
        summary['per_dimension'][d] = {'control_mean': round(statistics.mean(cs), 2), 'myh_mean': round(statistics.mean(ms), 2),
                                       'lift': round(statistics.mean(ms) - statistics.mean(cs), 2)}
for v in ('control', 'myh'):
    vs = [x['score_py']['verdict'] for x in rows if x['variant'] == v]
    summary['verdicts'][v] = {k: vs.count(k) for k in ('PASS', 'REVIEW', 'FAIL', 'CRITICAL FAIL')}
json.dump(summary, open(f'{RES}/_{tag}-summary.json', 'w'), indent=1)
print(json.dumps(summary, indent=1))
