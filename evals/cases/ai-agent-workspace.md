# EVAL-06 — Enterprise AI Agent Workspace

## Prompt

Build an enterprise AI workspace that can answer questions from approved company data and optionally take actions in connected systems.

Users need:
- conversation history;
- visible current data/tool scope;
- evidence-backed answers;
- structured long-running execution progress;
- estimated cost/risk when material;
- an approval gate before external mutations;
- partial-failure recovery and a final receipt.

## Transfer expectations

Conversation is for intent; execution state is structured and separately inspectable. Opening the page must not trigger model work. The UI must distinguish read-only reasoning from mutation and expose relevant scope, evidence, approval, cost/risk, and receipts.
