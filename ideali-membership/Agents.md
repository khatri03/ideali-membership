# AGENTS.md - ideali-membership

This file defines the working rules for AI coding agents and developers contributing to `ideali-membership`.

These rules exist to keep the application stable, maintainable, scalable, and production-ready without forcing unnecessary rewrites or overengineering.

When project-specific patterns conflict with general conventions, prefer the existing project architecture unless explicitly instructed otherwise.

---

# 1. Project Philosophy

- Treat the application as a production-grade SaaS product at all times.
- Build for a membership-driven product first. Favor clarity, trust, and conversion over visual noise.
- Favor maintainability, security, readability, accessibility, and reliability over clever abstractions.
- Preserve the existing architecture and design direction unless the user explicitly requests a refactor or redesign.
- Improve incrementally without destabilizing working systems.
- Protect user trust. Never expose secrets, credentials, tokens, or sensitive personal data.
- Treat all user-facing copy as customer-critical. Keep it concise, professional, and action-oriented.
- When a decision affects revenue, billing, permissions, compliance, subscriptions, or customer experience, clearly explain the tradeoff before proceeding.
- Prefer proven, boring, maintainable solutions over trendy or experimental patterns.
- **Security is not optional.** Every feature that touches data must consider tenant isolation, auth, and input validation.
- **Tests are not optional.** Untested code is a liability, not an asset.
- **Correctness over speed.** A slow PR that works beats a fast one that breaks prod.
- **Explicit over implicit.** Code should be readable without context. Name things clearly.
- **Boundaries are sacred.** The layered architecture exists to isolate change. Never shortcut across layers.
- Draw a thick line between "over engineered" and "well engineered".

---

# 2. Non-Negotiable SaaS Rules

- MUST inspect existing project patterns before making changes.
- MUST make the smallest safe change that fully satisfies the request.
- MUST preserve unrelated user changes.
- MUST maintain compatibility with the current architecture whenever possible.
- MUST NOT rewrite working systems just to match an ideal architecture.
- MUST NOT silently change existing business behavior without explicit confirmation.
- MUST NOT introduce unnecessary abstractions, dependencies, frameworks, or folder structures.
- MUST NOT invent business logic, pricing, permissions, subscription behavior, or policies.
- MUST NOT commit, push, delete, or run destructive commands unless explicitly instructed.
- MUST handle loading, error, empty, and success states for user-facing flows.
- MUST maintain responsive behavior across mobile, tablet, and desktop.
- MUST use semantic HTML, keyboard accessibility, visible focus states, and proper contrast.
- MUST explain important assumptions, risks, and impactful changes clearly.
- MUST prefer consistency with the existing codebase over theoretical perfection.

---

# 3. Development Standards

- Keep the application production-ready by default: typed, lint-friendly, responsive, accessible, and maintainable.
- Use React and TypeScript patterns that improve readability and long-term maintainability.
- Prefer reusable components and focused files over large monolithic components.
- Avoid long methods and deeply nested logic.
- Strictly follow SOLID, KISS, and DRY principles where practical.
- Avoid premature optimization and unnecessary abstraction.
- Avoid magic values when shared constants or reusable tokens make more sense.
- Prefer existing project conventions for:
  - state management
  - API access
  - validation
  - data fetching
  - folder structure
  - naming conventions
- Before introducing a new package or dependency, verify that the existing stack cannot reasonably solve the problem.
- Keep dependencies minimal.

## State & Data Management

- Prefer existing project patterns for state and data management.
- Prefer TanStack Query for server state, API data fetching, caching, mutations, and synchronization when already established in the project.
- Prefer Zustand for lightweight client-side UI state when existing project patterns support it.
- Avoid storing API response data in client-side state stores unless there is a clear reason.
- Avoid duplicating backend data across multiple frontend state layers.

---

# 4. Frontend Standards

- Preserve the existing UI direction unless explicitly asked to redesign.
- Prefer a premium, modern, calm visual style.
- Use spacing, hierarchy, and typography to guide attention before adding decoration.
- Use motion sparingly and only when it improves understanding or polish.
- Use Tailwind utility classes for styling whenever practical.
- Add custom CSS only when utility classes are insufficient.
- Keep layouts fully responsive across:
  - mobile
  - tablet
  - desktop
- Verify registration and membership flows at all breakpoints before considering work complete.

## Components

- Keep components small, focused, and readable.
- Avoid mixing business logic directly inside JSX.
- Prefer extracting reusable logic into hooks, utilities, or services when appropriate.
- Avoid deeply nested conditional rendering.
- Prefer named exports over default exports where practical.
- Avoid unnecessary prop drilling when cleaner alternatives already exist in the project.

## Forms

- Every required field must display a `*` consistently across all steps and field groups.
- Every password field must include an embedded eye icon toggle for visibility.
- Form validation messages should be clear, concise, and user-friendly.
- Avoid validating aggressively on every keystroke unless the UX explicitly requires it.

## User Experience

Every meaningful user-facing flow should properly handle:

- loading states
- empty states
- error states
- success states

Avoid:

- layout shifts
- flashing UI
- broken responsive layouts
- inaccessible interactions

---

# 5. Performance Standards

- Prefer efficient rendering patterns and avoid unnecessary re-renders.
- Avoid expensive operations inside render functions.
- Avoid duplicate API requests and unnecessary data fetching.
- Lazy-load heavy routes, pages, or components when practical.
- Prefer responsive and smooth user interactions over excessive visual effects.
- Avoid blocking UI interactions with heavy synchronous work.
- Optimize images and large assets when practical.
- Prefer maintainable performance improvements over premature micro-optimizations.
- Avoid unnecessary state updates and deeply nested component trees.
- Reuse existing data and UI patterns before introducing new complexity.
- When performance problems are suspected, profile and measure before optimizing.

---

# 6. Backend & API Standards

- Backend routes must start with `/api/<module-name>`.
- Frontend routes should mirror backend routes where applicable, excluding the `/api` prefix.
- Keep API logic and business logic separated where practical.
- Validate input at the appropriate boundary.
- Never expose internal stack traces, secrets, or implementation details in API responses.
- Prefer centralized API access patterns when the project structure supports them.
- Avoid duplicating backend contract logic across the frontend.
- - **Zero business logic in controllers**

## Backend Safety

Treat these areas as high-risk:

- authentication
- authorization
- registration
- billing
- subscriptions
- pricing
- member roles
- admin workflows
- customer data

Any changes affecting these areas must prioritize safety and predictability.

### Code quality rules (backend)

- Follow **SOLID, KISS, and DRY** strictly.
- Avoid long methods — break logic into small focused private methods or helper classes.
- Keep methods under ~30 lines as a guideline; extract if you need more.
- No magic values — use a named constant or a domain enum.
- No `async void` — always `async Task`. Unobserved exceptions in `async void` crash the process.

---

# 7. Database & Migration Rules

- If backend schema changes are required, use proper migration tooling only.
- Never hand-create migration files.
- Never modify existing applied migrations in unsafe ways.
- Prefer additive and backward-compatible schema changes whenever possible.
- Clearly explain risky schema changes before implementation.

---

# 8. Security Rules

- Never expose secrets, credentials, tokens, API keys, or connection strings.
- Never log passwords, tokens, payment information, or sensitive personal data.
- Never trust user input without validation.
- Never bypass authorization or permission checks.
- Never store sensitive data in unsafe locations.
- Sanitize or safely render user-generated content.
- Treat multi-user and membership data boundaries carefully.
- Prefer secure defaults over convenience shortcuts.

---

# 9. Accessibility Standards

Accessibility is a baseline requirement, not an optional enhancement.

Always ensure:

- semantic HTML
- keyboard accessibility
- visible focus states
- accessible labels
- sufficient contrast
- screen-reader-friendly interactions

Avoid:

- inaccessible custom controls
- hidden focus indicators
- click-only interactions

---

# 10. Quality Rules

Before finishing work:

- Verify consistency with the existing structure and naming conventions.
- Reason through build/runtime impact when changes may affect stability.
- Avoid weakening or removing existing tests to make changes pass.
- Add or update tests when modifying meaningful business logic if the project already supports testing patterns.
- Verify responsive behavior when changing layouts or forms.
- Verify accessibility when changing interactive UI.
- Verify type safety where applicable.
- Avoid leaving dead code, unused imports, or inconsistent patterns behind.

---

# 11. AI Agent Workflow

- Inspect existing architecture and conventions before coding.
- Follow existing patterns before introducing new ones.
- Prefer incremental improvements instead of broad rewrites.
- Avoid broad refactors during feature work unless explicitly requested.
- If existing code conflicts with these standards, improve safely and gradually.
- When a task is ambiguous, choose the safest reasonable implementation and clearly note assumptions.
- Explain important changes in plain language.
- Leave the codebase cleaner than you found it.

---

# 12. Collaboration Rules

- Treat commit and push actions as opt-in only.
- Do not commit or push unless explicitly instructed.
- Do not overwrite or remove unrelated user changes.
- Surface hidden risks instead of silently guessing.
- Keep communication concise, practical, and implementation-focused.
- Prefer collaborative and reversible changes over destructive ones.

---

# 13. Absolute Hard Rules

- Never expose secrets, credentials, tokens, or sensitive personal data.
- Never invent business logic, pricing, permissions, or policies.
- Never bypass authentication, authorization, or permission checks.
- Never rewrite working systems without explicit approval.
- Never introduce breaking architectural rewrites during normal feature work.
- Never overwrite unrelated user changes.
- Never commit or push unless explicitly instructed.
- Never add unnecessary dependencies or frameworks.
- Never prioritize speed over stability in critical flows.
- Never ignore accessibility, responsiveness, or security requirements.

## 14. Performance Standards

### Backend

- Use `async/await` throughout — never block threads with `.Result` or `.Wait()`.
- All list endpoints are **paginated** — never return unbounded result sets.
- Index all filtered and sorted columns

### Frontend

- Initial page load: **< 2s on 4G**.
- Route bundles: **< 150KB gzipped** per route.
- **Lazy-load all routes**: `const MembershipPage = lazy(() => import('./pages/MembershipPage'))`.
- Always define `staleTime` on every TanStack Query hook — absent `staleTime` causes redundant fetches.
- Images: WebP format, responsive `srcset`, lazy-loaded below the fold.
- Never use `useEffect` + `fetch` — use TanStack Query.
- Avoid premature memoization — reach for `React.memo`, `useMemo`, `useCallback` only when profiling shows a real problem.
- For folder structure, please refer .\AGENTS.folder-structure.md file
