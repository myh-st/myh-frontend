# MYH Frontend

A reusable Agent Skill for building calm, modern, production-grade enterprise frontends for AI, data, operations, workflow, and internal business applications.

The skill is framework-aware but framework-neutral: it inspects the existing application first, preserves working product contracts, and improves the current stack instead of rewriting it for aesthetics.

## UI preview

The examples below use **Sawasdee Hub**, a fictional product created only to demonstrate the design direction. They are intentionally shown as separate full-page concepts so you can inspect each surface clearly.

### 1. Login portal
<img width="768" height="512" alt="login-portal" src="https://github.com/user-attachments/assets/0deb2b5f-9469-46ae-87c7-c05cbbdf3d24" />

Secure enterprise authentication with strong branding, SSO-ready controls, a calm Thai-inspired visual identity, and a dedicated AI-agent mascot.

### 2. Home dashboard
<img width="768" height="512" alt="home-dashboard" src="https://github.com/user-attachments/assets/2babbeb6-f329-45c7-8ce9-f1357606ea25" />

A task-first operational dashboard: clear next actions, useful KPIs, recent activity, approvals, workload context, and an AI entry point without turning the screen into a card wall.

### 3. AI chat workspace
<img width="768" height="512" alt="ai-chat-workspace" src="https://github.com/user-attachments/assets/d4b878fa-c386-41fc-a1c3-6e951a6bb753" />

Enterprise chat is more than a message box. This concept separates conversation, history, structured AI results, evidence, scope, quality, and guardrails into a single inspectable workspace.

### 4. Connectors

<img width="768" height="512" alt="connectors" src="https://github.com/user-attachments/assets/24f10dfb-658d-433d-afaf-cddaa432da9c" />

Connect your enterprise tools and data sources securely, so AI can access the right context and take governed actions across your workflows.



> Preview images above are illustrative examples only; the skill is evaluated against cross-domain principles rather than screenshot similarity.

## What it optimizes for

- Clear task hierarchy instead of card walls
- Enterprise-flat visual language with restrained depth and motion
- Accessible interaction, keyboard support, and responsive behavior
- Explicit state, scope, risk, cost, approval, and side effects for governed AI workflows
- Compact AI/Agent experiences that separate conversation from execution state
- Production-ready implementation and verification, not mockup-only output

## Install

Copy the skill directory into a repository:

```bash
mkdir -p .agents/skills
cp -R .agents/skills/myh-frontend <target-repo>/.agents/skills/
```

For clients that require a vendor-specific skills directory, copy the same `myh-frontend` folder to that client's supported skill path. Keep one canonical source of the skill to avoid drift.

## Use

Typical prompts:

```text
Use $myh-frontend to redesign this dashboard without changing the backend contracts.
```

```text
Use $myh-frontend to review the current frontend and implement the highest-impact UX and accessibility fixes.
```

```text
Use $myh-frontend to build an enterprise AI approval flow with clear scope, risk, cost, and audit states.
```

## Evaluation

The repository includes a cross-domain evaluation suite under [`evals/`](evals/) to test whether the skill generalizes beyond the preview UI.

It covers hospital operations, banking risk, DevOps incident response, HR onboarding, retail analytics, enterprise AI agents, connector management, and government service casework. The benchmark scores task hierarchy, domain adaptation, contract preservation, state design, responsiveness, accessibility, visual consistency, maintainability, and AI governance where applicable.

The suite deliberately uses **golden principles, not golden screenshots**. A strong result should fit its domain rather than copy the Sawasdee Hub layout.

```bash
python evals/score.py evals/results/<result>.json
```

## Public-safe derivation

This repository contains reusable design and engineering principles only. It does not include proprietary source code, private product assets, credentials, customer data, or copied internal implementation files.

## License

MIT
