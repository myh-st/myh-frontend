# Frontend quality gates

Use this as the final implementation checklist. Adapt commands to the repository.

## Functional

- Requested flow works end-to-end with existing backend contracts.
- Primary action has success, failure, loading, and disabled/ineligible states.
- Async updates cannot apply stale responses over newer state.
- Polling/streams stop when hidden, detached, superseded, or terminal when applicable.
- Destructive/mutating actions require the intended confirmation/approval path.

## Accessibility

- Keyboard reaches every interactive control in logical order.
- Visible focus is present and not clipped.
- Dialogs have accessible names, focus management, safe Escape behavior, and focus return.
- Async status changes use appropriate status/alert semantics where needed.
- Semantic labels exist for forms and icon-only controls.
- State is never communicated by color alone.
- `prefers-reduced-motion` disables non-essential movement.
- Contrast meets WCAG AA for normal text and essential controls.

## Responsive

Verify 375, 768, 1024, and 1440 px:

- no horizontal page overflow;
- fixed/sticky navigation does not hide content;
- dialogs fit the viewport;
- touch controls remain usable;
- list/detail and multi-column layouts collapse intentionally;
- long labels, IDs, filenames, Thai/English mixed text, and localized copy wrap safely.

## Visual hierarchy

- One obvious primary action per task state.
- Secondary controls do not compete with the primary task.
- Operational screens avoid unnecessary gradients/glow/glass effects.
- Cards exist for grouping or interaction, not just decoration.
- Hover feedback is stable and does not shift layout.
- Icons are consistent SVGs; no emoji UI icons.

## Enterprise AI / governance

When applicable:

- opening/rendering does not silently make billable model calls;
- scope/role is visible at decision points;
- cost/budget is visible when it affects a decision;
- risk/side effects/data movement are explicit;
- approvals name the exact mutation;
- success is backed by a server-confirmed result/receipt;
- evidence/recovery is available after failure or partial completion.

## Engineering

Run what exists in the repository, for example:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

or the equivalent framework commands.

Also inspect the rendered UI when browser tooling is available. Passing unit tests is not a substitute for checking responsive layout, focus, overflow, and real interaction states.

## Handoff

Report only checks actually performed. If environment-only proof is missing, name it explicitly instead of marking it passed.
