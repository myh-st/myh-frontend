# EVAL-07 — Connector & Integration Hub

## Prompt

Improve an enterprise connectors page for cloud storage, collaboration, CRM, databases, and custom APIs. Preserve backend connector contracts and secret handling.

Users need:
- discover connectors by category/search;
- understand connected, degraded, expired, and disconnected states;
- see granted scopes and data direction;
- see last successful sync/test;
- connect, test, reauthorize, reconnect, or disconnect;
- understand failures without exposing credentials.

## Transfer expectations

Use a **catalog + connection-health** model, not a generic settings form. State must use text/icon cues in addition to color. High-impact disconnect/revoke actions need exact scope and confirmation. Secrets are never displayed back to the user.

## Watch for overfitting

Connector cards are appropriate only because the domain is a catalog; avoid adding unrelated KPI/dashboard surfaces.
