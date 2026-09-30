#!/usr/bin/env python3
"""Run activation prompts headless and record whether myh-frontend was loaded."""
import json, os, shutil, subprocess, sys, concurrent.futures as cf
import yaml  # type: ignore
ROOT = '/tmp/claude-0/evalrun'
REPO = '/home/user/myh-frontend'
SKILL = os.environ.get('SKILL_SRC', f'{REPO}/.agents/skills/myh-frontend')
FIX = f'{ROOT}/activation-fixture'
cases = yaml.safe_load(open(f'{REPO}/evals/activation-cases.yaml'))
ENV = {k: v for k, v in os.environ.items() if k not in ('CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_REMOTE_SESSION_ID', 'CLAUDECODE')}
ENV['IS_SANDBOX'] = '1'

def run(job):
    layout, model, trial, expected, cid, prompt = job
    tag = f'{layout}-{model}-t{trial}-{cid}'
    d = f'{ROOT}/activation/{tag}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(FIX, d)
    if layout == 'claude':
        shutil.copytree(SKILL, f'{d}/.claude/skills/myh-frontend')
    elif layout == 'agents':
        shutil.copytree(SKILL, f'{d}/.agents/skills/myh-frontend')
    log = f'{ROOT}/activation/{tag}.jsonl'
    with open(log, 'w') as fh:
        subprocess.run(['claude', '-p', prompt, '--model', model, '--output-format', 'stream-json', '--verbose',
                        '--max-turns', '6', '--no-session-persistence', '--dangerously-skip-permissions'],
                       cwd=d, env=ENV, stdout=fh, stderr=subprocess.STDOUT, timeout=900)
    listed = invoked = read_skill = False
    first_tools = []
    cost = None
    for line in open(log):
        try: m = json.loads(line)
        except Exception: continue
        if m.get('subtype') == 'init':
            listed = 'myh-frontend' in m.get('skills', [])
        if m.get('type') == 'assistant':
            for b in m['message'].get('content', []):
                if b.get('type') == 'tool_use':
                    inp = b.get('input', {})
                    first_tools.append(b['name'] + (':' + str(inp.get('skill')) if b['name'] == 'Skill' else ''))
                    if b['name'] == 'Skill' and 'myh-frontend' in str(inp.get('skill', '')):
                        invoked = True
                    if 'myh-frontend' in json.dumps(inp) and b['name'] in ('Read', 'Bash', 'Glob', 'Grep'):
                        read_skill = True
        if m.get('type') == 'result':
            cost = m.get('total_cost_usd')
    shutil.rmtree(d, ignore_errors=True)
    return dict(tag=tag, layout=layout, model=model, trial=trial, case=cid, expected=expected, skill_listed=listed,
                skill_tool_invoked=invoked, skill_file_read_manually=read_skill, activated=invoked or read_skill,
                tool_sequence=first_tools[:12], cost_usd=cost, log=os.path.basename(log))

if __name__ == '__main__':
    plan = json.loads(sys.argv[1])  # list of [layout, model, trials]
    jobs = []
    for layout, model, trials in plan:
        for t in range(1, trials + 1):
            for exp, key in ((True, 'positive'), (False, 'negative')):
                for c in cases[key]:
                    jobs.append((layout, model, t, exp, c['id'], c['prompt']))
    os.makedirs(f'{ROOT}/activation', exist_ok=True)
    out = f'{ROOT}/activation/results-{sys.argv[2]}.json'
    res = []
    with cf.ThreadPoolExecutor(int(os.environ.get('PAR', '6'))) as ex:
        for r in ex.map(run, jobs):
            res.append(r); print(json.dumps({k: r[k] for k in ('tag', 'activated', 'expected')}), flush=True)
            json.dump(res, open(out, 'w'), indent=1)
