# Enterprise AI UI rules

Use this reference for AI assistants, copilots, model-backed actions, generated content, workflow automation, and any operation where authority/cost/risk matters.

## Authority and context

The UI may display permissions and scope, but the server must remain authoritative.

Expose the context users need to understand an action:

- tenant/project/workspace;
- document/data source scope;
- role or capability when it changes available actions;
- selected model/provider when product-relevant;
- data residency or external data movement when relevant.

Do not have the model invent permissions or imply authority not granted by the backend.

## Model-call behavior

Do not trigger billable or side-effectful AI work simply because a page/modal opened.

Use explicit actions such as:

- Analyze
- Generate draft
- Extract
- Evaluate
- Repair
- Publish

When generation is expensive or long-running, show the trigger, progress, cancellation semantics when supported, and completion/receipt state.

## Cost and budget

If the product has budgets, reservations, quotas, or cost estimates, surface them close to the decision that consumes them. Advanced usage details can live under progressive disclosure.

Avoid presenting token counts as the only user-facing cost concept when the product can offer a clearer unit such as per document, page, run, or workflow.

## Risk and approvals

Read-only investigation should be visually distinct from mutating execution.

A mutating Agent action should identify:

- what will change;
- where it will change;
- whether external systems are involved;
- whether approval is required;
- whether the action can be reversed;
- what receipt/evidence will be available.

Approval UI must use exact action copy and cannot hide meaningful effects behind a generic confirmation.

## Conversation vs execution

Use chat for intent and clarification. Use structured UI for work state.

A strong Agent workspace usually contains:

- concise transcript;
- context chip/summary;
- task timeline or typed progress;
- approval gate when needed;
- structured result/evidence blocks;
- retry/recovery/reconciliation state.

Long-running progress should not be represented only as repeated assistant messages.

## Trustworthy outputs

Generated content should indicate important provenance or uncertainty where relevant. Provide evidence links or source references when the workflow supports them.

Do not show success before durable server state confirms success. If the backend is eventually consistent, distinguish accepted/processing/completed states.
