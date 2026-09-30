# MYH Frontend — Claude Code validation report

Date: 2026-09-30 · Evaluator: Claude Code (autonomous run of `evals/CLAUDE_CODE_VALIDATION_PROMPT.md`)

Machine-readable results: [`summary.json`](summary.json). First pass, one control and one MYH result per case: `<case>-control.json` and `<case>-myh.json`. After-change rescoring: [`after/`](after/). Activation raw results: [`activation/`](activation/). Screenshots: [`screenshots/`](screenshots/). Harness, fixtures and scorer prompts for reproducing the run: [`../../claude-harness/`](../../claude-harness/).

## 1. Executive summary

- **Discovery is the main portability gap.** Claude Code 2.1.285 does **not** discover skills in the repository's `.agents/skills/` layout. It does discover them in `.claude/skills/`, whether copied or symlinked.
  - With the skill in `.claude/skills/`, activation was perfect: precision 1.00, recall 1.00, 0/24 false positives across 60 sessions on Opus and Sonnet.
  - In the A/B runs, every treatment session (16/16) invoked the skill on its own.
- **The skill helps, consistently but modestly.** Across 8 unrelated domains the blind-scored first pass gave:
  - mean control **79.4**, mean MYH **85.9**, mean lift **+6.5** (median +5.5);
  - 7 of 8 cases improved and 1 regressed (government −2);
  - 5 PASS and 3 REVIEW for MYH, against 0 PASS, 6 REVIEW and 2 FAIL for control.
  
  An independent second scorer pass re-scored the same builds and gave a lift of **+8.1**.
- **Where the lift comes from:** accessibility (+0.75/5), governed-action behaviour (+0.75), interaction states (+0.62) and responsive behaviour (+0.62). The same model without the skill already produces domain-shaped layouts, so the gain on task hierarchy and domain fit was only +0.12.
- **No visual or layout overfitting.** The 8 MYH outputs have 8 different dominant layouts, and none shows a Sawasdee-style shell: no shared sidebar, no welcome hero, no mascot, no chat outside the agent case. They converge only on the skill's default palette and type (the `#155eef` accent in 7/8 outputs), which is the intended visual layer for unstyled products.
- **No critical failures in any MYH run**, before or after the change. Across all 24 builds, no build changed backend-owned files, no page issued a non-GET request on load, and every build passed lint, typecheck, tests and build.
- **Four minimal skill changes were made.** One fixes a real skill bug: the default palette fails WCAG AA. After the change:
  - colour-contrast failures went from 3 nodes to 0;
  - axe `scrollable-region-focusable` failures went from 2 nodes to 0;
  - loading screens showing premature "0"/empty text went from 3 to 0.
  
  The overall rubric score did not move (86.25 vs 86.25); the difference is within the measured scorer noise of about 4 points per build.

## 2. Environment, model and version

| Item | Value |
|---|---|
| Agent | Claude Code **2.1.285**, headless `claude -p --output-format stream-json --verbose --no-session-persistence --dangerously-skip-permissions` (`IS_SANDBOX=1`) |
| Model (A/B, scoring) | `claude-opus-5-5` for both arms; effort `high` (inherited `CLAUDE_EFFORT`, identical for both arms) |
| Model (portability sweep) | `claude-sonnet-5-5` (activation only) |
| Isolation | a fresh copy of the fixture per run, a new git baseline commit, and a new session id (`CLAUDE_CODE_SESSION_ID` unset); the parent repo is not on the path |
| Same for both arms | user-level skills and settings; the only difference is `.claude/skills/myh-frontend` in the treatment arm |
| Prompt | the `## Prompt` section of each case, word for word, plus one neutral line that is the same in both arms: *"The repository in the current directory is the existing frontend for this task. Work autonomously to completion; no one is available to answer questions during this task."* No design instructions and no mention of `$myh-frontend` |
| Fixtures | 8 runnable React 18 + TS + Vite 6 + Vitest 3 + ESLint 9 apps. Each has a frozen backend contract in `src/api/**` and an in-browser mock backend in `src/mock/**` with `?scenario=empty\|error\|forbidden\|stale\|slow\|partial`. Each ships a deliberately naive legacy UI and existing tests with `data-testid` selectors. See `evals/claude-harness/fixtures/` |
| Verification | `pnpm lint/typecheck/test/build` run by the harness, not taken from the agent's report. Then Playwright 1.56 on Chromium 141 checks: overflow at 375/768/1024/1440, a 30-step Tab walk at 1440 and 375, reduced-motion emulation, axe-core WCAG 2 A/AA, renders of the 5 scenarios, and a log of network calls on page load |
| Scoring | blind. Build labels were randomised (X/Y, later X/Y/Z), with any text naming the skill redacted. One Opus scorer per case scored with `rubric.yaml` and was told not to reward Sawasdee similarity, sidebars, KPI cards, blue colour, mascots or chat. `evals/score.py` computed every verdict |
| Cost | A/B control $25.69, MYH v1 $29.72 (+16% per run), MYH v2 $26.94, activation $17.06 |

## 3. Skill discovery behaviour

**How Claude Code finds skills.** It lists the skills it has discovered in the session's `init` message (`skills: [...]`). The model then chooses to call the `Skill` tool based on each skill's `description`. I checked three layouts with the init message:

| Layout | Listed in `init.skills` | Evidence |
|---|---|---|
| `.agents/skills/myh-frontend/` (this repo's layout) | **No**, 0/12 sessions | probe + 12 activation sessions |
| `.claude/skills/myh-frontend/` (copy) | **Yes**, 48/48 sessions | probe + 48 activation sessions + 16 A/B treatment sessions |
| `.claude/skills/myh-frontend` → symlink to `../../.agents/skills/myh-frontend` | **Yes** | probe |

**What happens with the `.agents` layout.** Opus still read `.agents/skills/myh-frontend/SKILL.md` in 6/6 frontend prompts and 0/6 backend prompts. That happened only because its first `find | head -50` listed the file in a 20-file fixture repo. This is incidental: it depends on the size of the repository and is not discovery. For Claude Code the skill has to live in, or be linked from, `.claude/skills/`. The README now says so.

**Discovery during the A/B runs.** All 8/8 v1 and 8/8 v2 treatment sessions called `Skill(myh-frontend)` on their own, usually as the first or second tool call. No control session referred to the skill.

## 4. Activation precision and recall

Setting: `evals/activation-cases.yaml`, each prompt word for word, in a neutral monorepo fixture (frontend pages plus FastAPI, Terraform, Kubernetes, SQL, IAM and Spark files), `--max-turns 6`. A run counted as activated if the session called `Skill(myh-frontend)` or read the skill's `SKILL.md`.

| Configuration | Sessions | TP | FP | FN | TN | Precision | Recall | Negative FP rate | Via Skill tool |
|---|---|---|---|---|---|---|---|---|---|
| v1, `.claude/skills`, Opus, 2 trials | 24 | 12 | 0 | 0 | 12 | **1.00** | **1.00** | 0.00 | 12/12 |
| v1, `.claude/skills`, Sonnet, 1 trial | 12 | 6 | 0 | 0 | 6 | **1.00** | **1.00** | 0.00 | 5/6 (1 read `SKILL.md` via `cat` after seeing it listed) |
| v2, `.claude/skills`, Opus, 1 trial | 12 | 6 | 0 | 0 | 6 | **1.00** | **1.00** | 0.00 | 6/6 |
| v1, `.agents/skills`, Opus (not discovered) | 12 | 6* | 0 | 0 | 6 | 1.00* | 1.00* | 0.00 | 0/6 |

\*Incidental file reads, not discovery (see §3). All six negative prompts (Postgres, Terraform, FastAPI, Kubernetes, IAM, Spark) stayed un-activated in every configuration. The skill's `description` was not changed, so v2 activation is unchanged by design, and the check above confirms it.

## 5. Per-case A/B results (first pass, blind, 2 builds per scorer)

| Case | Control | MYH | Δ | Dimensions improved | Dimensions regressed | Critical (C / M) | Did MYH change the IA appropriately? |
|---|---|---|---|---|---|---|---|
| Hospital operations | 82.0 REVIEW | **88.0 PASS** | +6 | interaction_state, accessibility, ai_governance | — | none / none | Same IA as control (capacity strip + triage queue + inspector), which is right for the domain. MYH added inline confirmation, a server-confirmed receipt and focus return |
| Banking risk | 82.0 REVIEW | **87.0 PASS** | +5 | responsive, accessibility, ai_governance | — | none / none | Queue → case workspace in both. MYH added mobile card stacking and a freeze approval with an acknowledgement, exact scope and the server receipt |
| DevOps control plane | 84.0 REVIEW | **88.0 PASS** | +4 | accessibility, maintainability | ai_governance | none / none | Incident → telemetry → remediation in both. MYH dropped the control's generic KPI row; the control had the stricter confirmation for the billable run |
| HR onboarding | 72.0 FAIL | **86.0 PASS** | +14 | interaction_state, responsive, visual_consistency, ai_governance | — | none / none | Checklist-first in both. MYH added confirmed approve/reject with receipts and no overflow at 768 |
| Retail analytics | 81.0 REVIEW | 84.0 REVIEW | +3 | interaction_state, responsive, ai_governance | contract_preservation | none / none | Trend-first analytics in both. MYH added export confirm + receipt and mobile collapse; it lost a point for a dev-only `?mockRole` hook in `main.tsx` |
| AI agent workspace | 73.0 FAIL | 84.0 REVIEW | +11 | task_hierarchy, domain_adaptation, responsive, accessibility, ai_governance | — | none / none | **Yes.** MYH separated execution into a Run inspector, while the control put run cards and approvals inside the chat transcript |
| Connector hub | 78.0 REVIEW | **89.0 PASS** | +11 | contract_preservation, interaction_state, responsive, accessibility, ai_governance | — | none / none | Health list + catalog in both. MYH's disconnect dialog showed exact scope and impact and blocked confirm until the impact data loaded |
| Government portal | 83.0 REVIEW | 81.0 REVIEW | **−2** | — | responsive | none / none | Queue + case file in both. MYH's SLA column was crushed at 1024 and evidence names wrapped per word at 375 |

**Aggregate (first pass):** mean control 79.38, mean MYH 85.88, **mean lift +6.50**, median +5.50. 7 cases improved and 1 regressed. Verdicts: control 0 PASS / 6 REVIEW / 2 FAIL / 0 CRITICAL; MYH 5 PASS / 3 REVIEW / 0 FAIL / 0 CRITICAL.

## 6. Aggregate score lift

**Per-dimension means (0–5).** Pass 1 compares control with MYH v1. Pass 2 is the independent 3-build rescoring of control, v1 and v2.

| Dimension (weight) | Control p1 | MYH p1 | Lift p1 | Control p2 | MYH v1 p2 | MYH v2 p2 |
|---|---|---|---|---|---|---|
| task_hierarchy (15) | 3.88 | 4.00 | +0.12 | 3.88 | 4.12 | 4.12 |
| domain_adaptation (15) | 3.88 | 4.00 | +0.12 | 3.88 | 4.00 | 4.12 |
| contract_preservation (15) | 4.75 | 4.75 | 0.00 | 4.88 | 4.88 | 4.75 |
| interaction_state (15) | 4.12 | 4.75 | **+0.62** | 3.75 | 4.75 | 4.88 |
| responsive (10) | 3.38 | 4.00 | **+0.62** | 3.38 | 4.12 | 3.88 |
| accessibility (10) | 3.62 | 4.38 | **+0.75** | 3.38 | 4.12 | 4.25 |
| visual_consistency (10) | 3.88 | 4.00 | +0.12 | 3.88 | 4.00 | 3.88 |
| maintainability (5) | 3.88 | 4.00 | +0.12 | 4.00 | 4.00 | 3.88 |
| ai_governance (5) | 3.88 | 4.62 | **+0.75** | 3.75 | 4.50 | 4.75 |
| **Weighted mean /100** | **79.38** | **85.88** | **+6.50** | **78.12** | **86.25** | **86.25** |

**Scorer reliability.** The 16 control and v1 builds were scored twice, by different blind scorers with different packet compositions:

- mean |Δ| was 3.94 points per build (max 11);
- all 144/144 dimension scores agreed within ±1;
- the sign of the lift agreed in 7 of 8 cases; government flipped from −2 to +4.

**Scorer-observed state coverage (8 cases).**

| State | Control | MYH v1 | MYH v2 |
|---|---|---|---|
| Confirmation | 6/8 | 8/8 | 7/8 |
| Success receipt | 7/8 | 8/8 | 8/8 |

Loading, empty, error, permission, stale and recovery were seen in 8/8 in every arm. Partial was seen in 7/8 in every arm; hospital never rendered it differently.

## 7. Overfitting analysis

Case | dominant IA of MYH output | justified patterns | suspicious copied patterns | verdict

| Case | Dominant IA (MYH v1) | Justified patterns | Suspicious patterns | Verdict |
|---|---|---|---|---|
| Hospital | capacity strip + grouped alert queue + sticky inspector (drill-in view below 960px) | ward tiles that filter the queue, with text pressure labels; Needs-action grouping; handoff timeline in the inspector | tiles look like a card row, but they carry queue pressure and filter the queue | **Not overfit** |
| Banking | alert queue table → case workspace (evidence + audit + sticky decision/freeze aside) | severity/confidence triage; modal freeze approval with acknowledgement | heavy decorative icons; AI hypothesis placed above transaction evidence (the control did the same) | **Not overfit** (minor evidence-order issue, model-wide) |
| DevOps | triage table → incident workspace (telemetry → investigation → remediation) with owner/timeline aside | telemetry tabs with trace↔log links; citation → telemetry highlight | 4-tile health strip. The *control* had a generic KPI row | **Not overfit** |
| HR | cohort table → hire workspace (checklist main, approvals/docs/PII rail) + manager next-step cards | dependency-aware checklist; PII revealed on demand | small 3-tile KPI row on the manager summary | **Not overfit** (mild) |
| Retail | metric-selector KPIs + trend with click-to-rescope + comparison + anomaly rail | KPI tiles switch the chart metric; anomaly "Investigate" applies scope and date | four KPI tiles (all three builds had them; the domain names exactly these four metrics) | **Justified** |
| AI agent | history sidebar + conversation + tabbed Run/Scope inspector (panes on mobile) | conversation kept apart from execution; per-action approval dialog | a common three-pane AI shell; the domain requires conversation history | **Justified** |
| Connector | health table with status filters above a category catalog + detail page | catalog cards only inside the catalog; state-derived next action per row | letter-avatar logos; "N need attention" banner tied to the task | **Justified** |
| Government | SLA-chip-filtered case queue + case record with sticky next-action panel (Thai-first) | action rail lists only server-allowed actions; receipt cites the audit entry | pill/rounded card styling | **Not overfit** |

**Cross-domain collapse check.** The contact sheets in [`screenshots/contact-sheet-*-primary-1440.jpg`](screenshots/) show the primary screen of every case side by side.

- **No sidebar in the skill's reference style:** only the AI case, whose history pane is required by the domain, has a left rail.
- **No generic KPI row:** a KPI-like row appears only where it filters the work (hospital, retail, and devops' health strip).
- **No welcome hero or greeting** in 0/8 cases; **no mascot** in 0/8; **no chat** outside the AI case.
- **No connector-style cards** outside the connector catalog.

**What does converge** is the visual token layer. 7/8 MYH outputs use the `#155eef` accent and 6/8 declare DM Sans, against 0/8 in the control. Every fixture shipped with Arial and no design system, so the skill's "use defaults for greenfield or weakly-styled products" rule applies. This is shared visual language, not layout copying. One side effect: 0/8 MYH v1 outputs added dark mode, against 5/8 controls. The skill's palette is light-only and never mentions dark mode; this is neutral with respect to the rubric.

**Control vs treatment layouts.** The control arm arrives at nearly the same layout per domain (queue + inspector, case workspace, incident workspace, and so on). The skill therefore does not *create* domain adaptation; the model already does that. The skill adds governance, state, accessibility and responsive rigour on top, and does not collapse the domains into one template.

## 8. Accessibility and responsive findings

Harness-run results. "Overflow" counts page/width combinations out of 8–12 where `scrollWidth > innerWidth`. "Focus" is visible-focus stops over Tab stops across 4 Tab walks. RM = number of `prefers-reduced-motion` media rules; no build had any animation running under `reduce`. "Non-GET" = mutating requests issued on page load.

| Case | Arm | Checks* | Overflow | axe WCAG A/AA nodes | Focus visible | RM | Non-GET | Tests |
|---|---|---|---|---|---|---|---|---|
| Hospital | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 0 / 0 / 0 | 113/113, 111/111, 113/113 | 1/1/1 | 0/0/0 | 14/14/11 |
| Banking | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 8 contrast / 1 scroll-region / 3 aria-prohibited-attr | 114/114 all | 1/1/1 | 0/0/0 | 22/19/20 |
| DevOps | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 9 contrast / 1 scroll-region / 0 | 116/116, 118/118, 114/114 | 1/1/1 | 0/0/0 | 17/18/19 |
| HR | control / v1 / v2 | ✓ / ✓ / ✓ | **1** (768) / 0 / 0 | 0 / 1 contrast / 0 | all visible | 1/1/1 | 0/0/0 | 25/22/23 |
| Retail | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 0 / 2 contrast / 0 | 112/120, 110/118, 112/118 | 1/1/1 | 0/0/0 | 33/24/24 |
| AI agent | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / **6** | 2 scroll-region / 0 / 0 | all visible | 1/1/1 | 0/0/0 | 17/15/14 |
| Connector | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 0 / 0 / 0 | all visible | 1/1/1 | 0/0/0 | 20/23/16 |
| Government | control / v1 / v2 | ✓ / ✓ / ✓ | 0 / 0 / 0 | 0 / 0 / 0 | all visible | 1/2/1 | 0/0/0 | 18/19/18 |
| **Total** | control / v1 / v2 | 24/24 each | 1 / 0 / 6 | **19 / 5 / 3** | — | 8/8 each | **0 / 0 / 0** | — |

\*`pnpm lint`, `typecheck`, `test` and `build` all exited 0.

**Findings**

- **v1 contrast failures were caused by the skill.** Both v1 colour-contrast failures (HR, retail) are the skill's own token pair, Muted `#64748b` on Background `#f6f8fb`, at 4.47:1. The default Success `#059669` (3.77:1) and Warning `#d97706` (3.19:1) also fail as text on white. The control's contrast failures came from the model's own orange/amber colours.
- **Scrollable regions without keyboard access** (axe `scrollable-region-focusable`) appeared in v1 (banking table wrapper, devops timeline) and in the control (AI drawers). There are none in v2.
- **Content squeeze is not caught by overflow checks.** Scorers found it by inspecting screenshots: government v1's SLA column was crushed at 1024; connector v1's action column was clipped at 1024 on the partial scenario; the AI v1 inspector wrapped its diff table. In pass 2, government v2 scored 5 on responsive.
- **The AI v2 overflow was a one-off bug, not a skill pattern.** A `.sr-only` label with `position:absolute` and no positioned ancestor widens the page by 16–108 px, leaving a blank area. The 375 px flow stays usable, and neither scorer flagged `broken_mobile`.
- **Keyboard:** the 30-step Tab walks reached only named controls in every build; the name check counts `aria-labelledby` after a harness fix. Every stop showed a detectable focus style, with one exception: retail's native `<input type="date">` From/To fields in all three arms. Chromium draws focus on the date segments inside the input, so the harness cannot measure a style on the input element itself; I have **not** verified focus visibility for those two fields.
- **Reduced motion:** every build includes a `prefers-reduced-motion` rule, and no animations run under `reduce`.
- **Mock scenarios:** slow (loading), empty, error, forbidden and partial were rendered for primary and detail routes in every build (`<case>-*.json → objective_checks`). Stale-version (409) and permission-on-mutation flows were checked by the scorers in code and through each build's unit tests. They were **not** exercised by automated browser interaction.

## 9. Critical failures

- **First pass: none** in any build (0/16).
- **Second pass:** one, **control** hr-onboarding, `unsafe_mutation`. `src/features/hire/Approvals.tsx` calls `api.decideApproval` in one click with no confirmation. The first-pass scorer saw the same code and chose to count it under interaction_state/ai_governance rather than as a critical failure. This is a scorer-calibration disagreement, not a new defect.
- **MYH v1 and v2:** 0 critical failures in either pass.
- **Objective backstops, all 24 builds:**
  - 0 changes to backend-owned `src/api/**` or `src/mock/**`;
  - 0 non-GET requests on page load, so no silent billable or mutating calls;
  - original test selectors present in every build, where static detection flagged two as missing (`region-row`, `cred-apiKey`) the scorers confirmed they are generated dynamically;
  - no build reports success before the server's response; every scorer checked this in code.

## 10. Changes made to the skill

Only failures that recur across unrelated cases *and* trace to the skill (or to a gap in its guidance) were addressed. Each change is domain-neutral.

| # | Evidence | Where the failure came from | Change |
|---|---|---|---|
| 1 | axe contrast failures in HR v1 and retail v1, both on `#64748b` on `#f6f8fb` = 4.47:1 | **Skill bug**: the default palette fails WCAG AA | `references/visual-system.md`: Muted → `#5b6b80` (≥ 5.1:1 on all three default surfaces). Added text-safe Success `#047857`, Warning `#b45309` and Danger `#b91c1c`. Stated contrast as part of the token contract |
| 2 | Loading shown as "All 0", "0 Hires" or "No run selected / Scope unavailable" in 3 v1 builds (AI, connector, HR) and 1 control; error shown as an empty catalog in connector | Model-general, and the skill's state list didn't separate loading, empty and failed | `SKILL.md` "Cover all states": no derived zeros, counts, empty or "unavailable" copy while a request is in flight; a failed load must never look empty. Same check added to `quality-gates.md` |
| 3 | Column squeeze with no page overflow: government v1 at 1024 and 375, connector v1 at 1024, AI v1 inspector, devops v1 section nav at 375; control HR at 768, control banking hides columns | Model-general; the skill's responsive gate only mentioned overflow | `SKILL.md` Responsive: squeeze counts as a defect; change the representation before compressing; judge from screenshots. `quality-gates.md`: "no content squeeze" |
| 4 | axe `scrollable-region-focusable` in banking v1, devops v1 and AI control | Model-general a11y gap not covered by the gates | `quality-gates.md`: every scrollable region must be reachable by keyboard (`tabindex="0"` plus a name, or a focusable child), or the overflow removed |
| — | `.agents/skills` not discovered by Claude Code | Packaging and portability | `README.md`: Claude Code install via `.claude/skills/` symlink or copy. The canonical source stays in `.agents/skills/` |

**Rejected as too case-specific, or not recurring:**

- **Patient identifier (MRN) in queue rows:** only in hospital v2. The skill has no PII-minimisation rule; a candidate for later, but there is only one case of evidence.
- **Hospital "partial" state not rendered:** seen in all arms, so it is not caused by the skill.
- **AI hypothesis ordered above evidence (banking):** seen in both arms, one case only.
- **Adding dark mode to the palette:** not required by the rubric.
- **Changing the skill description:** activation was already perfect.

## 11. Before/after regression results

v2 = skill with changes 1–4. Every case was re-run once with v2. Changes 1–4 target government, HR, retail, AI and connector (the affected cases); hospital, banking and devops served as unrelated regression cases. Control, v1 and v2 were then blind-scored together, three builds per scorer.

| Case | Role | Control | MYH v1 | MYH v2 | v2 − v1 | Targeted defect in v2 |
|---|---|---|---|---|---|---|
| Government | affected (squeeze) | 84 | 88 | **97** | **+9** | Squeeze gone: responsive 5, tablet two-column cards, actions first on mobile |
| HR | affected (contrast, loading) | 76 (CRITICAL) | 83 | 85 | +2 | 0 contrast nodes; no "0 Hires" while loading |
| Retail | affected (contrast) | 77 | 84 | 83 | −1 | 0 contrast nodes |
| AI agent | affected (loading, squeeze) | 78 | 95 | 82 | **−13** | Loading copy fixed; new, unrelated `.sr-only` overflow and a catch-all route replacing the two routes |
| Connector | affected (loading) | 69 | 83 | 82 | −1 | No "All 0" while loading; best loading/error handling of the three builds |
| Hospital | regression | 82 | 83 | 88 | +5 | — |
| Banking | regression | 77 | 87 | 86 | −1 | scroll-region fixed; new `aria-prohibited-attr` (3 nodes) |
| DevOps | regression | 82 | 87 | 87 | 0 | scroll-region fixed (0 axe nodes) |
| **Mean** | | **78.12** | **86.25** | **86.25** | **0.00** | |

**Objective before → after (v1 → v2).**

| Measure | v1 | v2 |
|---|---|---|
| axe nodes | 5 | 3 |
| colour-contrast nodes | 3 | **0** |
| scroll-region nodes | 2 | **0** |
| premature zero/empty copy during loading | 3 | **0** |
| live regions in loading renders | 7 | 14 |
| overflow combinations | 0 | 6 (AI `.sr-only` bug only) |
| critical failures | 0 | 0 |
| checks passing | 24/24 | 24/24 |
| MYH PASS count | 4 | 5 |

**Interpretation.** The targeted defects disappeared, and nothing got worse in the regression cases beyond scorer noise. The aggregate rubric score is unchanged; the change sits within the ~4-point noise per build. The AI −13 comes from one v2 build with an implementation bug (misplaced `.sr-only` label) and a route simplification. Neither is linked to the new guidance, but with one sample per arm this cannot be proven. **The changes are kept** because they fix a verifiable skill bug (contrast) and remove the specific defects they targeted, without reducing activation or overall scores.

## 12. Remaining limitations

- **One generation per arm per case.** Run-to-run variance of the implementing agent was not measured. Scorer noise was: about 4 points per build. Differences under ~5 points on a single case are not meaningful.
- **Scorers are Claude Opus.** They are the same family as the implementing agent, so self-preference bias is possible for both arms. Blinding was imperfect: the skill's palette (blue accent, DM Sans) may reveal the treatment build even with the skill's name redacted. Scorers were told not to reward blue or reference-product similarity.
- **Fixtures are synthetic.** Claude subagents built them to a neutral spec (`claude-harness/fixture-spec.md`). The backend is an in-browser mock, not a real service. Existing-product constraints are simpler than in production codebases.
- **Automated browser checks do not click through mutations.** 409 stale, 403 on mutation, confirmation dialogs and receipts were verified by scorers reading code, by each build's own unit tests, and in the agents' own sessions. My harness did not drive them in the browser. Screen-reader output was not tested. Contrast was measured by axe at 1024 px on primary and detail routes only.
- **Heuristics.** Page-overflow detection does not catch squeeze; scorers judged that from screenshots. The keyboard-name heuristic gave false positives on `aria-labelledby` until patched; axe confirmed the names. `vite preview` was replaced by a Python static server after concurrent agent sessions killed `vite` processes; results are unaffected.
- **Portability sweep scope.** The Sonnet check covered activation only; the A/B implementations ran on Opus only. Other vendors' agents were not tested in this run.
- **Activation logs.** The per-session Opus trial-1 activation logs were overwritten by the v2 activation run. The summarised results (`activation/results-main.json`) were saved before that and are complete.
- **Environment.** Tests ran on Linux Chromium only. Older office displays were approximated by a 1024 px viewport; no real device or browser matrix was used.

## 13. Conclusion: generalisation and Claude portability

**Generalisation.** In Claude Code the skill transfers across eight unrelated domains without imposing a reference layout. Each domain kept its own information architecture: queue + inspector, case workspace, incident workspace, checklist, analytics, agent workspace, catalog + health, and bilingual case queue. What the skill adds is consistent:

- stricter governed-action flows, with exact-scope confirmations, acknowledgements and server-confirmed receipts;
- more complete and more truthful states;
- fewer accessibility violations (19 → 5 → 3 axe nodes);
- better responsive recomposition.

The result is a +6.5 to +8.1 point mean lift with no critical failures. Contract preservation was already strong in the control, and the skill kept it that way. Overfitting is limited to the visual token layer, which the skill intentionally supplies for unstyled products.

**Claude portability.** The skill's content and `description` work well in Claude Code: activation precision and recall were 1.00 on both Opus and Sonnet, and treatment sessions invoked the skill on their own in 16/16 A/B runs. The **packaging** is not portable as shipped, because Claude Code ignores `.agents/skills/`. With a `.claude/skills/` symlink or copy, now documented in the README, the skill is discovered and used as intended.
