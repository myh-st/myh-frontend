# Claude Code A/B harness

These are the scripts and fixtures behind [`../results/claude/REPORT.md`](../results/claude/REPORT.md). The scripts assume a scratch root of `/tmp/claude-0/evalrun`; change `ROOT` at the top of each script to use another location.

| Path | Purpose |
|---|---|
| `fixtures/<case>/` | Runnable "existing product" for each eval case: React + TS + Vite, with a frozen `src/api/**` contract and an in-browser mock backend in `src/mock/**` (`?scenario=empty\|error\|forbidden\|stale\|slow\|partial`). `_base/` is the shared template |
| `fixture-spec.md` | The neutral spec the fixtures were built from |
| `activation-fixture/` | Mixed monorepo used for the activation prompts |
| `bin/activation.py` | Runs the activation prompts headless and records `Skill` tool calls (`python3 bin/activation.py '[["claude","claude-opus-5-5",1]]' tag`) |
| `bin/ab.py` | Control vs treatment runs: same prompt and model; the treatment has `.claude/skills/myh-frontend` (`python3 bin/ab.py case1,case2 [control,myh]`) |
| `bin/collect.py` | Runs lint/typecheck/test/build, captures the diff and contract-file changes, then calls `verify.js` |
| `bin/verify.js` | Playwright + axe: overflow at 375/768/1024/1440, Tab walk, reduced motion, scenario renders, requests made on page load |
| `bin/packet.py` | Builds blind, randomised, redacted scoring packets |
| `scorer-prompt.md`, `scorer-prompt-3.md` | Instructions for the blind scorers (2-build and 3-build) |
| `bin/compile.py`, `bin/compile3.py` | Unblind the scores, write per-run result JSONs, run `evals/score.py`, and aggregate |

Requirements: `claude` CLI, Node 22, pnpm 10, Python 3 with PyYAML and Pillow, and `playwright` + `@axe-core/playwright` installed in the tools directory. When running as root, `IS_SANDBOX=1` is needed for `--dangerously-skip-permissions`.
