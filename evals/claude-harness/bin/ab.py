#!/usr/bin/env python3
"""A/B runner: same fixture, same prompt, same model; treatment has the skill in .claude/skills."""
import json, os, re, shutil, subprocess, sys, time, concurrent.futures as cf
ROOT = '/tmp/claude-0/evalrun'
REPO = '/home/user/myh-frontend'
SKILL = os.environ.get('SKILL_SRC', f'{REPO}/.agents/skills/myh-frontend')
MODEL = os.environ.get('MODEL', 'claude-opus-5-5')
OUT = os.environ.get('AB_OUT', f'{ROOT}/ab')
ENV = {k: v for k, v in os.environ.items() if k not in ('CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_REMOTE_SESSION_ID', 'CLAUDECODE')}
ENV['IS_SANDBOX'] = '1'
WRAPPER = ("The repository in the current directory is the existing frontend for this task. "
           "Work autonomously to completion; no one is available to answer questions during this task.\n\n")

def case_prompt(case):
    text = open(f'{REPO}/evals/cases/{case}.md').read()
    m = re.search(r'## Prompt\n\n(.*?)(?=\n## )', text, re.S)
    return m.group(1).strip()

def sh(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)

def run(job):
    case, variant = job
    d = f'{OUT}/{case}-{variant}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(f'{ROOT}/fixtures/{case}', d, ignore=shutil.ignore_patterns('node_modules', 'dist'))
    if variant == 'myh':
        shutil.copytree(SKILL, f'{d}/.claude/skills/myh-frontend')
    sh('git init -q && git add -A && git -c user.email=eval@local -c user.name=eval commit -qm baseline && pnpm install --offline --silent', d)
    prompt = WRAPPER + case_prompt(case)
    open(f'{d}.prompt.txt', 'w').write(prompt)
    log = f'{d}.jsonl'
    t0 = time.time()
    with open(log, 'w') as fh:
        try:
            subprocess.run(['claude', '-p', prompt, '--model', MODEL, '--output-format', 'stream-json', '--verbose',
                            '--no-session-persistence', '--dangerously-skip-permissions'],
                           cwd=d, env=ENV, stdout=fh, stderr=subprocess.STDOUT, timeout=int(os.environ.get('AB_TIMEOUT', '5400')))
            timed_out = False
        except subprocess.TimeoutExpired:
            timed_out = True
    wall = time.time() - t0
    listed = invoked = False; tools = {}; result = None; cost = None; turns = None; refs = []
    for line in open(log):
        try: m = json.loads(line)
        except Exception: continue
        if m.get('subtype') == 'init': listed = 'myh-frontend' in m.get('skills', [])
        if m.get('type') == 'assistant':
            for b in m['message'].get('content', []):
                if b.get('type') == 'tool_use':
                    tools[b['name']] = tools.get(b['name'], 0) + 1
                    s = json.dumps(b.get('input', {}))
                    if b['name'] == 'Skill' and 'myh-frontend' in s: invoked = True
                    if 'myh-frontend' in s and b['name'] != 'Skill': refs.append(b['name'])
        if m.get('type') == 'result':
            result = m.get('result'); cost = m.get('total_cost_usd'); turns = m.get('num_turns')
    meta = dict(case=case, variant=variant, model=MODEL, skill_listed=listed, skill_tool_invoked=invoked,
                skill_file_refs=refs, tool_counts=tools, final_message=result, cost_usd=cost, num_turns=turns,
                wall_seconds=round(wall), timed_out=timed_out)
    json.dump(meta, open(f'{d}.meta.json', 'w'), indent=1)
    return meta

if __name__ == '__main__':
    cases = sys.argv[1].split(',')
    variants = sys.argv[2].split(',') if len(sys.argv) > 2 else ['control', 'myh']
    os.makedirs(OUT, exist_ok=True)
    jobs = [(c, v) for c in cases for v in variants]
    with cf.ThreadPoolExecutor(int(os.environ.get('PAR', '8'))) as ex:
        for meta in ex.map(run, jobs):
            print(json.dumps({k: meta[k] for k in ('case', 'variant', 'skill_tool_invoked', 'cost_usd', 'wall_seconds', 'timed_out')}), flush=True)
