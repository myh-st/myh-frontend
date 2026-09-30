# EVAL-02 — Banking Risk & Fraud Console

## Prompt

Improve an enterprise fraud-investigation frontend without changing existing APIs, case permissions, or audit events.

Investigators need to:
- triage alerts by severity and confidence;
- inspect transaction evidence and related entities;
- record a case decision;
- request a second-person approval before freezing an account;
- understand what an AI-generated hypothesis is based on;
- recover cleanly from stale-case and permission errors.

## Transfer expectations

Use a **risk/case-investigation** information architecture. Evidence and timeline should dominate over decorative dashboard content. The freeze action must show exact scope, impact, approval requirement, and server-confirmed receipt.

## Watch for overfitting

A chat-first layout is incorrect unless conversation materially helps the case workflow. AI evidence must remain subordinate to authoritative case state.
