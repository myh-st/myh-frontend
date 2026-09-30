# Blind scorer instructions

You are an independent, blind evaluator of two frontend implementations ("Build X" and "Build Y") produced by
coding agents for the SAME task on the SAME starting repository. You do not know how they were produced and must
not try to find out. Only read files inside the packet directory given below. Do NOT open any other directory
under /tmp/claude-0/evalrun (in particular not `ab/`, `evidence/`, `.blindmap/`, `fixtures/`), and do not look at
any repository's `.agents` or `.claude` folders.

Packet directory: {PACKET}

Contents:
- case.md — the task prompt given to both builds plus "transfer expectations" for evaluators
- rubric.yaml — scoring dimensions, weights, critical-failure rules
- expected-principles.md — golden principles (not golden screenshots)
- fixture-README.md, legacy-App.tsx — the starting repository's README (backend contract, routes, test selectors) and legacy UI
- build-X/, build-Y/ each with:
  - diff.patch — full source diff vs the starting repo (lockfile excluded)
  - evidence.json — lint/typecheck/test/build exit codes and output tails (run by the harness, not self-reported),
    changed files, whether backend-owned files (src/api/**, src/mock/**) changed, whether original test selectors still exist,
    source grep signals, and the agent's final message (self-reported; treat claims skeptically)
  - verify.json — automated Playwright results from the built app: per-route/per-width horizontal overflow
    (pageOverflowX, offenders), small touch targets, keyboard Tab-walk (stops, focusVisible count, unnamed stops),
    reduced-motion (running animations under `reduce`, number of reduced-motion media rules), axe WCAG A/AA violations,
    API calls made on page load (`loadRequests`, look for non-GET calls = side effects on render), and mock-backend
    scenario renders (`slow` ≈ loading at 700ms, `empty`, `error`, `forbidden` = read-only role, `partial`) with visible text
  - screens/*.png — screenshots: `<page>-<width>.png` at 375/768/1024/1440, `<page>-scenario-<name>.png`, `<page>-focus-1440.png`

Method:
1. Read case.md, rubric.yaml, expected-principles.md, fixture-README.md, legacy-App.tsx.
2. For each build, read the diff in full (it is the primary evidence), evidence.json and verify.json, and LOOK AT the
   screenshots (at least all four widths of the primary and detail pages, the scenario shots, and the focus shot).
3. Score every rubric dimension 0–5 (0 absent/harmful, 1 major failure, 2 weak, 3 acceptable, 4 strong, 5 excellent).
   Mark a dimension not_applicable only if genuinely irrelevant (e.g. ai_governance when the task has no AI and no governed
   mutations — note: approvals/freeze/remediation/disconnect/decision approvals ARE governed actions, so ai_governance applies).
4. Apply critical-failure rules exactly as defined in rubric.yaml, using ids from it. Only flag with concrete evidence
   (file+line or verify.json fact). Examples: a POST on page load in `loadRequests` → silent_side_effect; a destructive or
   high-impact mutation executed with no confirmation step → unsafe_mutation; UI showing "done/succeeded" before the server
   response confirms it → false_success; src/api or src/mock modified without the task requiring it → unrequested_contract_break;
   UI gating being the only authorization (e.g. client-side role checks that let the client decide privileged scope while
   ignoring server allowedActions) → unauthorized_client_authority; primary flow overflow/hidden at 375 → broken_mobile.
5. Do NOT reward: resemblance to any reference product, presence of a sidebar, KPI cards, blue colour, mascots, or chat UI
   unless the domain calls for it. DO reward: domain-appropriate IA, task hierarchy, contract preservation, state
   completeness, accessibility, responsive recomposition, maintainability, governed-action behaviour.
6. Also characterise each build's composition for an overfitting analysis: dominant IA (e.g. "queue + inspector"),
   patterns justified by the domain, and suspicious generic/copied patterns (generic KPI row, welcome hero, chat added
   where not needed, catalog cards outside catalogs, mascot, identical sidebar shell) — describe what you see.
7. Be calibrated and specific. Two builds can both be strong or both weak; do not force a spread.

Write your result to {PACKET}/scores.json with EXACTLY this shape, then reply with a 5-line summary:
{
  "case": "<case id>",
  "builds": {
    "X": {
      "scores": {"task_hierarchy": n, "domain_adaptation": n, "contract_preservation": n, "interaction_state": n,
                 "responsive": n, "accessibility": n, "visual_consistency": n, "maintainability": n, "ai_governance": n},
      "not_applicable": [],
      "critical_failures": [],
      "critical_failure_evidence": {},
      "rationale": {"<dimension>": "<1-2 sentences with concrete evidence>"},
      "dominant_ia": "<short>",
      "justified_patterns": ["..."],
      "suspicious_patterns": ["..."],
      "states_observed": {"loading": bool, "empty": bool, "error": bool, "permission": bool, "stale": bool, "partial": bool,
                          "success_receipt": bool, "confirmation": bool, "recovery": bool},
      "notable_strengths": ["..."],
      "notable_defects": ["..."]
    },
    "Y": { ...same... }
  },
  "comparison": "<3-5 sentences comparing X and Y>"
}
