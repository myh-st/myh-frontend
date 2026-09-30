---
name: myh-frontend
description: Design, implement, refactor, or review production-grade enterprise frontend experiences with MYH's calm task-first visual system. Use for dashboards, admin consoles, AI/Agent workspaces, document/data operations, login portals, workflow builders, approval flows, responsive UI, accessibility fixes, or frontend polish. Inspect the existing repository and visual target first, preserve working backend contracts and framework choices, then improve hierarchy, interaction, accessibility, state visibility, and implementation quality. Do not use for backend-only work.
license: MIT
compatibility: Works with skills-compatible coding agents. Best with repository read/write access plus optional browser or screenshot tools for visual QA.
---

# MYH Frontend

Build frontends that feel modern without becoming decorative, busy, or fragile. Optimize for task completion, trustworthy state, accessibility, and maintainable implementation.

## Operating rules

1. Inspect before changing. Read the current framework, routing, templates/components, CSS/design tokens, API contracts, tests, and existing UI conventions. Do not migrate frameworks just to achieve a visual refresh.
2. Preserve the product contract. Keep working endpoints, authorization, data semantics, form names, URLs, server-owned state, telemetry contracts, and test selectors unless the task explicitly changes them.
3. Respect a supplied visual target. If the user provides a screenshot, design, Figma frame, or explicit style, match that target before applying MYH defaults. Accessibility, truthful state, and safe interaction remain mandatory.
4. Prefer one primary task surface. Reduce competing cards, duplicate actions, decorative copy, and equal-weight panels. Use progressive disclosure for secondary evidence and advanced controls.
5. Implement the complete requested slice. Do not stop after scaffolding or a cosmetic patch when the task also requires interaction, responsive behavior, tests, or integration.

## Choose the surface mode

Classify the screen before styling:

- **Operational** — admin, review, data, connections, queue, detail, settings. Flat, compact, neutral, high signal.
- **Welcome / dashboard** — may use one branded hero, assistant entry point, or illustration. Keep operational content below it restrained.
- **Agent / chat** — concise conversation plus distinct execution/progress state; approvals and receipts are explicit.
- **Auth / login** — strong brand recognition, compact form, calm background, minimal distractions.
- **Builder / canvas** — workspace first; inspectors and controls support the canvas instead of competing with it.
- **Approval / destructive** — exact operation, scope, impact, cost/risk, reversibility, and confirmation must be visible before action.\n- **Integration / connector** — discovery, auth/scope, health, last sync/test, reconnect, and revoke/disconnect state must be explicit.\n- **Control plane / incident** — health and incident context first; telemetry and evidence support investigation; remediation is a governed action with confirmation and receipt.

Read `references/patterns.md` when the task matches one of these surfaces.

## Visual direction

Use the existing design system when present. For greenfield or weakly-styled products, use the defaults in `references/visual-system.md`.

Core defaults:

- Enterprise-flat surfaces: white / slate backgrounds, crisp borders, restrained blue accent.
- Strong typography and information hierarchy; avoid marketing-style filler copy.
- Controls around 8–12 px radius; cards around 12–16 px radius; pills only for chips/status/filter semantics.
- Subtle elevation only when hierarchy needs it. Avoid glassmorphism and shadow-heavy card walls on operational screens.
- Color communicates hierarchy and state, but never state by color alone.
- Use SVG icons from one consistent family. Do not use emoji as product UI icons.
- Avoid gradients by default. A branded/welcome surface may use a controlled decorative treatment when it does not reduce readability.
- Avoid layout-shifting hover effects, `transition: all`, excessive scale/translate animation, and animation that hides system state.

## Interaction and accessibility

Treat accessibility as implementation, not a final polish pass.

- Provide visible keyboard focus for every interactive element.
- Target at least 44 px touch height for primary controls on touch-oriented surfaces.
- Use explicit labels, semantic HTML, correct button/link behavior, and meaningful accessible names.
- Use `aria-live` or status semantics for asynchronous state changes when users need notification.
- Respect `prefers-reduced-motion`; non-essential motion must disable cleanly.
- Preserve focus and scroll where partial updates or polling could otherwise disrupt the user.
- Do not rely on hover alone for critical information or controls.
- Verify text contrast to WCAG AA and test error/success/warning states without color-only meaning.

Read `references/quality-gates.md` before finalizing.

## Responsive behavior

Verify at minimum:

- 375 px — stacked mobile flow; no horizontal overflow; 16 px minimum input text where mobile zoom is a concern.
- 768 px — compact tablet layout; collapse secondary panels before compressing the primary task.
- 1024 px — practical two-column/list-detail layouts.
- 1440 px — comfortable desktop density without stretching text or data beyond useful reading widths.

Use responsive layout changes, not merely smaller fonts.

## Enterprise AI and governed actions

For AI/Agent features, read `references/enterprise-ai-ui.md`.

Minimum expectations:

- Opening a screen should not silently trigger billable model calls or mutating actions.
- Show server-authorized scope and role where it affects what the user can do.
- Make risk, cost/budget, data movement, approvals, and side effects visible at decision points.
- Separate conversation from execution/progress when the Agent performs real work.
- Use compact action/result cards, evidence links, and typed states instead of long chat prose.
- Mutating actions need explicit confirmation and a receipt/result state; failures need recovery guidance.

## Implementation workflow

### 1. Inspect

Identify:

- framework and rendering model;
- entry points, routes, layouts, components/templates;
- design tokens and shared primitives;
- API/authorization boundaries;
- existing tests, selectors, accessibility patterns, and responsive breakpoints.

### 2. Define the UX delta

State the smallest coherent change that solves the user problem. Prefer changing hierarchy and action priority before adding decorative components.

### 3. Implement in the current stack

Reuse primitives first. Introduce a new abstraction only when it removes real duplication or establishes a reusable UI contract.

Keep state ownership clear:

- server owns authority, permissions, durable workflow state, and security decisions;
- client owns presentation state such as open/closed panels, local drafts, focus, and non-authoritative view preferences.

### 4. Cover all states

Implement and visually account for relevant states:

- loading / skeleton;
- empty;
- populated;
- partial / stale;
- validation error;
- permission denied;
- offline/network failure when relevant;
- success / receipt;
- destructive confirmation;
- long content and localization overflow.

### 5. Verify

Run the repository's normal formatter/linter/typecheck/tests/build. Then verify keyboard interaction, responsive widths, reduced motion, focus behavior, and state transitions.

If browser tooling is available, visually inspect the actual rendered result rather than trusting source code alone.

### 6. Report

Return a concise implementation summary with:

- what changed;
- why the hierarchy or interaction improved;
- tests/build/visual checks actually run;
- any remaining constraint that requires environment or product-owner evidence.

Do not claim a visual or functional check that was not performed.

## Default decision heuristics

When uncertain:

- Fewer stronger surfaces beat more cards.
- One obvious next action beats multiple equal CTAs.
- Local updates beat full-page disruption.
- Progressive disclosure beats permanent advanced detail.
- Clear state copy beats decorative labels.
- Stable color/opacity hover beats movement.
- Existing stack and contracts beat aesthetic rewrites.
- Evidence and receipts beat optimistic success messaging.

## User overrides

Explicit user requirements for brand, visual style, framework, or density override the aesthetic defaults in this skill. Preserve accessibility, truthful state, authorization boundaries, and safe confirmation behavior unless the user explicitly changes the product contract and the change is valid for the application.
