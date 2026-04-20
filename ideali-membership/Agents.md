# Agents.md

This file defines the working rules for agents contributing to `ideali-membership`.

## Business Rules

- Build for a membership-driven product first. Favor clarity, trust, and conversion over visual noise.
- Treat all user-facing content as customer-critical. Keep copy concise, professional, and action-oriented.
- Do not invent business logic, pricing, or policies unless the user explicitly asks for placeholders.
- Prefer scalable patterns that support plans, subscriptions, member roles, and admin workflows.
- Protect user trust. Never suggest storing secrets, credentials, or personal data in unsafe ways.
- When a decision affects revenue, compliance, or customer experience, call out the tradeoff before changing it.

## Development Rules

- Keep the app production-ready by default: typed, lint-friendly, responsive, and easy to extend.
- Use React and TypeScript patterns that improve maintainability. Avoid unnecessary abstraction.
- Prefer reusable components and small focused files over large monolith components.
- Preserve the existing design direction unless the user requests a redesign.
- Use Tailwind utility classes for styling. Add custom CSS only when utility classes are not enough.
- When backend work is needed, refer to the API project at `D:\My Projects\V4Ideas\Ideali\ideali.api` as the source backend codebase.
- Make accessibility a baseline requirement: semantic HTML, visible focus states, good contrast, and keyboard support.
- Avoid hardcoded magic values when a shared constant or reusable token makes more sense.
- Document any non-obvious behavior directly in code or in this file.

## Quality Rules

- Before finishing, verify that changes are consistent with the app structure and naming.
- If a change might break build or runtime behavior, test or reason through the impact explicitly.
- Keep dependencies minimal. Add a package only when it clearly improves the project.
- Do not remove or overwrite unrelated user changes.
- If a task is ambiguous, choose the safest reasonable implementation and note the assumption.

## UI Rules

- Prefer a premium, modern, calm visual style.
- Use spacing, hierarchy, and typography to guide attention before adding decoration.
- Keep layouts completely responsive from mobile to desktop and make sure the UI looks modern at every breakpoint.
- Use motion sparingly and only when it improves understanding or polish.

## Collaboration Rules

- Work incrementally and leave the codebase cleaner than you found it.
- Explain important changes in plain language.
- If a request has hidden risk, pause and surface the risk instead of silently guessing.
