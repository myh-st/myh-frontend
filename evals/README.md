# MYH Frontend Evaluation Suite

This suite tests whether the skill transfers its principles across unrelated product domains instead of reproducing one reference layout.

## What success means

A successful implementation should adapt to the domain while retaining the MYH Frontend principles: clear task hierarchy, calm enterprise UI, explicit state, accessibility, responsive behavior, maintainable implementation, and governed AI actions when applicable.

Visual similarity to the Sawasdee Hub examples is **not** a success criterion.

## Evaluation layers

1. **Activation** — Does the agent invoke the skill for frontend work and avoid it for backend-only work?
2. **Adherence** — After activation, does the output follow the skill rules?
3. **Transfer** — Does the UI structure change appropriately for hospital, banking, DevOps, HR, retail, government, integrations, and AI-agent domains?
4. **Implementation** — Are existing product contracts preserved and relevant tests/build checks run?
5. **Portability** — Do different skills-compatible agents interpret the same skill consistently?

## Recommended A/B protocol

Run each case in two clean sessions with the same model, repository fixture, and user prompt:

- **A / control:** skill unavailable or explicitly not loaded.
- **B / treatment:** MYH Frontend installed and available for normal discovery.

Do not tell the evaluator which output is A or B. Score both with `rubric.yaml`.

For automatic-skill-discovery testing, do **not** explicitly say `$myh-frontend` in the case prompt. Record whether the agent selected the skill on its own.

## Scoring

Use 0–5 for every applicable dimension:

- 0 = absent or harmful
- 1 = major failure
- 2 = weak
- 3 = acceptable
- 4 = strong
- 5 = excellent

`score.py` converts dimension scores to a weighted 100-point result and applies critical-failure overrides.

Thresholds:

- PASS: >= 85
- REVIEW: 75–84.99
- FAIL: < 75
- CRITICAL FAIL: any critical-failure rule is triggered regardless of score

## Run order

1. Run `activation-cases.yaml`.
2. Run every prompt in `cases/` as A/B.
3. Capture screenshots, implementation diff, test/build output, and key agent reasoning summary where available.
4. Complete one result JSON per run using `result-template.json`.
5. Score it:

```bash
python evals/score.py evals/results/<result>.json
```

6. Compare recurring failure modes rather than optimizing for one screenshot.\n\n## Claude Code portability run\n\nUse [`CLAUDE_CODE_VALIDATION_PROMPT.md`](CLAUDE_CODE_VALIDATION_PROMPT.md) from a clean Claude Code session to run skill discovery, activation, A/B cross-domain evaluation, overfitting analysis, regression reruns, and PR creation.
