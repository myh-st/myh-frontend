# EVAL-03 — DevOps Incident Control Plane

## Prompt

Build the frontend for an enterprise incident-management control plane while preserving the existing service, incident, telemetry, and remediation APIs.

Users need:
- production health and active incidents;
- service ownership;
- logs, metrics, and traces for the selected incident;
- an AI-assisted root-cause investigation with cited evidence;
- a proposed remediation;
- explicit approval before running a mutating remediation;
- a receipt and rollback/recovery state after execution.

## Transfer expectations

The primary surface should be **incident/evidence/remediation**, not a card wall. Telemetry should drill into the selected incident. Conversation and execution state should be distinct. Mutating remediation requires scope, risk, approval, and result receipt.
