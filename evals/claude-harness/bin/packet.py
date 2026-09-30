#!/usr/bin/env python3
"""Build anonymized, randomized scoring packets: one dir per case with Build-X / Build-Y."""
import json, os, random, re, shutil, sys
ROOT = '/tmp/claude-0/evalrun'
REPO = '/home/user/myh-frontend'
EV = os.environ.get('EV_OUT', f'{ROOT}/evidence')
PK = os.environ.get('PK_OUT', f'{ROOT}/packets')
MAP = os.environ.get('MAP_OUT', f'{ROOT}/.blindmap/map.json')
RED = re.compile(r'myh[-_ ]?frontend|\bMYH\b|\.claude/skills|Sawasdee', re.I)
def redact(s): return RED.sub('[REDACTED]', s)

SOURCES = json.loads(os.environ.get('SOURCES', '{"control": "%s", "myh": "%s"}' % (EV, EV)))

def build(case, variants=None, seed=None):
    variants = variants or list(SOURCES)
    rnd = random.Random(seed if seed is not None else case + str(len(variants)))
    labels = ['X', 'Y', 'Z'][:len(variants)]; rnd.shuffle(labels)
    mapping = {}
    pdir = f'{PK}/{case}'
    shutil.rmtree(pdir, ignore_errors=True); os.makedirs(pdir)
    shutil.copy(f'{REPO}/evals/cases/{case}.md', f'{pdir}/case.md')
    shutil.copy(f'{REPO}/evals/rubric.yaml', f'{pdir}/rubric.yaml')
    shutil.copy(f'{REPO}/evals/expected-principles.md', f'{pdir}/expected-principles.md')
    shutil.copy(f'{ROOT}/fixtures/{case}/README.md', f'{pdir}/fixture-README.md')
    shutil.copy(f'{ROOT}/fixtures/{case}/src/App.tsx', f'{pdir}/legacy-App.tsx')
    for v, lab in zip(variants, labels):
        run = f"{case}-{v.split('@')[0]}"
        src = f'{SOURCES[v]}/{run}'; dst = f'{pdir}/build-{lab}'
        os.makedirs(dst)
        c = json.load(open(f'{src}/collect.json'))
        sess = c.pop('session', {}) or {}
        c.pop('run', None)
        c['agent_final_message'] = sess.get('final_message')
        c['session_timed_out'] = sess.get('timed_out')
        open(f'{dst}/evidence.json', 'w').write(redact(json.dumps(c, indent=1)))
        open(f'{dst}/diff.patch', 'w').write(redact(open(f'{src}/diff.patch').read()))
        if os.path.exists(f'{src}/verify.json'):
            open(f'{dst}/verify.json', 'w').write(redact(open(f'{src}/verify.json').read()))
        os.makedirs(f'{dst}/screens')
        for f in os.listdir(src):
            if f.endswith('.png'): shutil.copy(f'{src}/{f}', f'{dst}/screens/{f}')
        mapping[lab] = v
    return mapping

if __name__ == '__main__':
    os.makedirs(os.path.dirname(MAP), exist_ok=True)
    allmap = json.load(open(MAP)) if os.path.exists(MAP) else {}
    for case in sys.argv[1:]:
        allmap[case] = build(case)
    json.dump(allmap, open(MAP, 'w'), indent=1)
    print('packets built for', sys.argv[1:])
