# EVAL-01 — Hospital Operations Console

## Prompt

Redesign and implement a responsive hospital operations console used by coordinators. The current backend contracts must remain unchanged.

Users need to:
- see bed/room operational status and queue pressure;
- identify cases needing operational attention;
- inspect handoff history and ownership;
- filter by ward and urgency;
- acknowledge or escalate an operational alert;
- work on desktop and tablet during rounds.

Do not imitate a supplied reference product. Choose the layout that best fits this workflow.

## Transfer expectations

This should become an **operations/queue-first** experience, not a generic KPI dashboard. Urgent items need non-color cues. Patient-sensitive detail should appear only where necessary for the operational task. Secondary history belongs in an inspector/disclosure rather than competing with the queue.

## Watch for overfitting

Fail domain adaptation if the result simply reproduces Sawasdee Hub navigation, hero, KPI cards, or mascot placement without a task reason.
