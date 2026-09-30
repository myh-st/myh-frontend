# Claude Code validation prompt

Use this prompt from a clean Claude Code session against the repository.

```text
You are the independent evaluator and implementation runner for the MYH Frontend Agent Skill.

Repository:
https://github.com/myh-st/myh-frontend

Goal:
Determine whether the myh-frontend skill is discoverable, correctly activated, instruction-following, cross-domain, non-overfit, and portable in Claude Code.

Important:
- Work autonomously through the entire evaluation suite in this session.
- Do not stop after one case.
- Do not ask me to manually run each case.
- Do not optimize for visual similarity to Sawasdee Hub.
- Do not modify the skill before completing the first full benchmark pass.
- Preserve evidence for every conclusion.
- If an environment limitation blocks rendered UI proof, continue every test that can still be completed and record the limitation precisely.

PHASE 0 — Inspect
1. Clone/open the repository and read:
   - .agents/skills/myh-frontend/SKILL.md
   - every file under .agents/skills/myh-frontend/references/
   - evals/README.md
   - evals/rubric.yaml
   - evals/activation-cases.yaml
   - evals/expected-principles.md
   - every case under evals/cases/
2. Confirm how Claude Code discovers skills in this environment.
3. Do not explicitly invoke $myh-frontend during automatic-discovery tests unless a later step specifically asks for explicit invocation.

PHASE 1 — Skill activation benchmark
Run every positive and negative prompt from evals/activation-cases.yaml in isolated/clean contexts where possible.

For each prompt record:
- expected activation: yes/no;
- actual discovery/activation: yes/no;
- evidence that the skill was or was not loaded;
- false positive / false negative classification.

Calculate:
- activation precision;
- activation recall;
- negative-case false-positive rate.

Do not modify skill metadata yet.

PHASE 2 — Cross-domain A/B benchmark
For every file under evals/cases/:

A. CONTROL
Run the case without MYH Frontend available/loaded.

B. TREATMENT
Run the exact same case with MYH Frontend installed and available through normal skill discovery.
Do not add extra design instructions to the treatment prompt.

Use the same model/configuration for A and B.

For both variants:
- produce the strongest implementation or implementation plan the environment supports;
- if a runnable frontend fixture is available, implement and render it;
- if the case is evaluated as a design/architecture output only, produce enough concrete IA/component/state detail to score fairly;
- capture screenshots when rendering is possible;
- record files changed, tests/builds run, and limitations.

PHASE 3 — Blind scoring
Score every A and B result using evals/rubric.yaml.

Use 0–5 per dimension.
Mark dimensions not applicable only when genuinely irrelevant.
Apply critical-failure overrides exactly as defined.

Do not reward:
- resemblance to Sawasdee Hub;
- presence of a sidebar;
- use of KPI cards;
- blue color;
- mascot usage;
- chat UI unless the domain actually calls for conversation.

Reward:
- domain-appropriate information architecture;
- task hierarchy;
- preservation of product/backend contracts;
- state completeness;
- accessibility;
- responsive recomposition;
- maintainability;
- governed AI/action behavior where applicable.

Store one JSON result per run under:
evals/results/claude/<case>-control.json
evals/results/claude/<case>-myh.json

Use:
python evals/score.py <result.json>

PHASE 4 — Overfitting analysis
Compare all MYH treatment outputs to each other.

Specifically check whether unrelated domains collapse into the same composition.

Look for repeated unjustified patterns such as:
- identical sidebar structure;
- identical 4-KPI row;
- identical welcome hero;
- AI chat added where not needed;
- connector-style cards used outside catalogs;
- mascot placed in operational workflows without task value.

Produce an overfitting matrix:
case | dominant IA | justified patterns | suspicious copied patterns | verdict

The expected outcome is shared principles with different information architectures.

PHASE 5 — Implementation quality checks
Where runnable implementations exist, verify:
- lint;
- typecheck;
- tests;
- build;
- 375 / 768 / 1024 / 1440 responsive behavior;
- keyboard flow and visible focus;
- reduced-motion behavior;
- loading / empty / error / permission / stale / success states where applicable.

Do not claim checks that were not actually run.

PHASE 6 — Compare control vs MYH
For each case report:
- control score;
- MYH score;
- delta;
- dimensions improved;
- dimensions regressed;
- critical failures;
- whether MYH changed the IA appropriately.

Then aggregate:
- mean control score;
- mean MYH score;
- mean lift;
- per-dimension lift;
- number of PASS / REVIEW / FAIL / CRITICAL FAIL results;
- activation precision/recall.

PHASE 7 — Minimal skill improvements
Only after the benchmark is complete:

1. Identify recurring failures that are caused by the skill, not by one case.
2. Propose the smallest reusable changes to SKILL.md or references.
3. Reject changes that merely optimize for one eval case or one screenshot.
4. Preserve:
   - accessibility;
   - server-authoritative permissions/state;
   - product/backend contract preservation;
   - safe governed mutations;
   - framework neutrality.

If the evidence supports a change:
- implement it;
- rerun only the affected activation/cross-domain cases plus at least two unrelated regression cases;
- compare before/after scores.

PHASE 8 — Final artifacts
Create:
- evals/results/claude/REPORT.md
- evals/results/claude/summary.json

REPORT.md must include:
1. Executive summary
2. Environment/model/version
3. Skill discovery behavior
4. Activation precision/recall
5. Per-case A/B results
6. Aggregate score lift
7. Overfitting analysis
8. Accessibility/responsive findings
9. Critical failures
10. Changes made to the skill, if any
11. Before/after regression results
12. Remaining limitations
13. Final conclusion on generalization and portability

Commit all legitimate evaluation artifacts and any evidence-backed skill improvements to a new branch.

Do not merge into main automatically.
Open a pull request targeting main with a concise summary and the benchmark evidence.

Completion criteria:
- all activation cases executed;
- all 8 cross-domain cases evaluated as A/B;
- rubric results written;
- overfitting analysis complete;
- aggregate metrics calculated;
- any skill change backed by rerun evidence;
- PR opened;
- no unsupported claims.
```
