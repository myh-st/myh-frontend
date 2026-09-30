#!/usr/bin/env python3
"""After-pass: unblind 3-build packets (control, myh@v1, myh@v2), write result JSONs, score, summarize."""
import json, os, re, subprocess, sys, statistics
REPO = '/home/user/myh-frontend'
DIMS = ['task_hierarchy', 'domain_adaptation', 'contract_preservation', 'interaction_state', 'responsive',
        'accessibility', 'visual_consistency', 'maintainability', 'ai_governance']
RES, PK, MAP = sys.argv[1:4]
SRC = {'control': '/tmp/claude-0/evalrun/evidence', 'myh@v1': '/tmp/claude-0/evalrun/evidence', 'myh@v2': '/tmp/claude-0/evalrun/evidence-v2'}
mapping = json.load(open(MAP)); os.makedirs(RES, exist_ok=True)
rows = []
for case in sorted(mapping):
    p = f'{PK}/{case}/scores.json'
    if not os.path.exists(p): print('missing', case); continue
    s = json.load(open(p))
    for label, variant in mapping[case].items():
        b = s['builds'][label]; ev = SRC[variant]; run = f"{case}-{variant.split('@')[0]}"
        c = json.load(open(f'{ev}/{run}/collect.json')); v = json.load(open(f'{ev}/{run}/verify.json'))
        sess = c.get('session', {})
        name = variant.replace('@', '-')
        res = {'case': case, 'variant': name, 'skill_version': {'control': None, 'myh@v1': 'v1 (original)', 'myh@v2': 'v2 (this PR)'}[variant],
               'agent': f"Claude Code 2.1.285 headless, model {sess.get('model')}",
               'scores': {d: b['scores'][d] for d in DIMS}, 'not_applicable': b.get('not_applicable', []),
               'critical_failures': b.get('critical_failures', []),
               'evidence': {'skill_discovered': sess.get('skill_listed'), 'skill_invoked': sess.get('skill_tool_invoked'),
                            'tests_run': [f"pnpm {k}: {'pass' if x['exit'] == 0 else 'fail'}" for k, x in c['checks'].items()] + ['playwright 375/768/1024/1440 + keyboard + reduced-motion + axe + scenarios'],
                            'screenshots': [], 'notes': s.get('comparison', '')},
               'phase': 'after (3-build blind rescoring)', 'blind_label': label,
               'scorer_rationale': b.get('rationale', {}), 'critical_failure_evidence': b.get('critical_failure_evidence', {}),
               'overfitting': {'dominant_ia': b.get('dominant_ia'), 'justified_patterns': b.get('justified_patterns', []), 'suspicious_patterns': b.get('suspicious_patterns', [])},
               'states_observed': b.get('states_observed', {}), 'strengths': b.get('notable_strengths', []), 'defects': b.get('notable_defects', []),
               'objective_checks': {'axe': v['axe'], 'horizontal_overflow': {p: {w: x['pageOverflowX'] for w, x in d.items()} for p, d in v['responsive'].items()},
                                    'non_get_on_load': [x for l in v['loadRequests'].values() for x in l if not x.startswith('GET')],
                                    'backend_contract_files_changed': c['contract_files_changed']},
               'session': {k: sess.get(k) for k in ('cost_usd', 'num_turns', 'wall_seconds')}}
        path = f'{RES}/{case}-{name}.json'
        json.dump(res, open(path, 'w'), indent=1, ensure_ascii=False)
        out = subprocess.run(['python3', f'{REPO}/evals/score.py', path], capture_output=True, text=True).stdout
        res['score_py'] = {'score': float(re.search(r'score: ([\d.]+)', out).group(1)), 'verdict': re.search(r'verdict: (.*)', out).group(1).strip()}
        json.dump(res, open(path, 'w'), indent=1, ensure_ascii=False); rows.append(res)
summ = {'cases': {}, 'per_dimension': {}, 'verdicts': {}}
for case in sorted({r['case'] for r in rows}):
    r = {x['variant']: x for x in rows if x['case'] == case}
    summ['cases'][case] = {k: r[k]['score_py']['score'] for k in ('control', 'myh-v1', 'myh-v2')}
    summ['cases'][case].update({'v1_lift': round(r['myh-v1']['score_py']['score'] - r['control']['score_py']['score'], 2),
                                'v2_lift': round(r['myh-v2']['score_py']['score'] - r['control']['score_py']['score'], 2),
                                'v2_minus_v1': round(r['myh-v2']['score_py']['score'] - r['myh-v1']['score_py']['score'], 2),
                                'criticals': {k: r[k]['critical_failures'] for k in r}})
for k in ('control', 'myh-v1', 'myh-v2'):
    summ[f'mean_{k}'] = round(statistics.mean(v[k] for v in summ['cases'].values()), 2)
    vs = [x['score_py']['verdict'] for x in rows if x['variant'] == k]
    summ['verdicts'][k] = {q: vs.count(q) for q in ('PASS', 'REVIEW', 'FAIL', 'CRITICAL FAIL')}
for d in DIMS:
    summ['per_dimension'][d] = {k: round(statistics.mean(x['scores'][d] for x in rows if x['variant'] == k), 2) for k in ('control', 'myh-v1', 'myh-v2')}
json.dump(summ, open(f'{RES}/_after-summary.json', 'w'), indent=1)
print(json.dumps(summ, indent=1))
