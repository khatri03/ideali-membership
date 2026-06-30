# Engineering Standards — Enterprise React SaaS

Industry-standard practices for production-grade, scalable React + TypeScript SaaS applications. All contributors and agents must follow these standards.

---

## 1. Project Structure

```
src/
  app/              # App-level setup: router, providers, global config
  features/         # Feature-sliced modules (one folder per domain)
    <feature>/
      components/   # UI components scoped to this feature
      hooks/        # Custom hooks
      lib/          # Business logic, API calls, utils
      types/        # TypeScript types/interfaces
      pages/        # Page-level components (route entry points)
  shared/           # Truly cross-feature, reusable UI + utilities
    components/
    hooks/
    lib/
  lib/              # App-wide utilities (api.ts, parseUtils.ts, etc.)
  types/            # Global types
```

- Never put business logic in page components. Pages orchestrate; hooks and lib handle logic.
- Feature folders own their own types, hooks, and lib. Promote to `shared/` only when two or more features need it.
- One component per file. File name matches export name exactly.

---

## 2. Component Design

- **Single responsibility**: one concern per component.
- **Max ~150 lines per component file**. If longer, extract subcomponents or hooks.
- **Props**: always type explicitly. Never use `any`. Prefer specific interfaces over generic `Record<string, unknown>`.
- **No prop drilling beyond 2 levels**. Use context, state manager, or composition instead.
- **Presentational vs container**: keep UI components dumb; wire data in parent hooks or page components.
- **Compound components** for complex UI (e.g. `<Modal>`, `<Modal.Header>`, `<Modal.Body>`).
- **Default exports only for pages/routes**. Named exports for everything else.

```tsx
// Good
export function MemberCard({ member }: MemberCardProps) { ... }

// Bad — default export on shared component makes refactoring harder
export default function MemberCard(...) { ... }
```

---

## 3. TypeScript

- `strict: true` always. No exceptions.
- No `any`. Use `unknown` + type guards when type is truly unknown.
- Prefer `interface` for public shapes; `type` for unions, intersections, mapped types.
- Never `as T` cast without a runtime guard backing it.
- Discriminated unions for state machines and multi-state responses:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

- Colocate types with the feature that owns them. Promote to `src/types/` only for app-wide contracts.

---

## 4. State Management

- **Local state first** (`useState`, `useReducer`). Don't reach for global state until you actually need it.
- **URL state** for filters, pagination, sorting — keeps UI bookmarkable and shareable.
- **Server state** via React Query (TanStack Query): fetch, cache, invalidate. Do not duplicate server data in client state.
- **Global client state** (auth, theme, user preferences) via React Context. Keep context value stable — memoize providers.
- Never store derived data in state. Compute it.

```ts
// Bad
const [fullName, setFullName] = useState(`${first} ${last}`);

// Good
const fullName = `${first} ${last}`;
```

---

## 5. Data Fetching & API Layer

- All API calls go through a single typed `getJson` / `postJson` abstraction in `src/lib/api.ts`. No raw `fetch` in components.
- Return typed response objects — never return `any`.
- Handle errors at the call site. Propagate meaningful error messages; never swallow errors silently.
- Use React Query for all server state:
  - Query keys follow `[module, id?, params?]` pattern for predictable invalidation.
  - Invalidate related queries after mutations.
  - Use `staleTime` to avoid redundant network calls for stable data.
- Backend routes: `/api/<module>`. Frontend paths mirror without `/api` prefix.

```ts
// Query key pattern
const memberKeys = {
  all: ['members'] as const,
  list: (params: MemberQueryParams) => ['members', 'list', params] as const,
  detail: (id: string) => ['members', 'detail', id] as const,
};
```

---

## 6. Custom Hooks

- One hook = one concern.
- Hooks own their own loading, error, and data state.
- Never return raw server data from a hook — transform to the UI model inside the hook.
- Prefix with `use`. No exceptions.
- Keep hook files small: if a hook file exceeds ~120 lines, split into sub-hooks.

---

## 7. Forms

- Use controlled components with a form library (React Hook Form preferred).
- Validate with Zod schemas colocated in `<Component>.schema.ts`.
- Always show inline validation errors — never alert().
- Disable submit while loading/validating. Show loading state on the button.
- Required fields always show `*`. Consistent across all forms.
- Password fields always include embedded eye icon to toggle visibility.

---

## 8. Error Handling

- Use an `ErrorBoundary` at route level to catch render-time errors.
- API errors: display user-friendly messages. Log full error detail in dev; suppress in prod.
- Never expose stack traces or internal error codes to end users.
- Distinguish recoverable errors (retry UI) from fatal errors (redirect to error page).
- Use `never` in exhaustive switch branches to catch unhandled cases at compile time:

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${x}`);
}
```

---

## 9. Performance

- **Code splitting**: lazy-load all page components with `React.lazy` + `Suspense`.
- **Memoization**: `useMemo` / `useCallback` only when profiling confirms a bottleneck. Don't pre-optimize.
- **List rendering**: always provide stable, unique `key` props. Never use array index as key for dynamic lists.
- **Images**: use lazy loading (`loading="lazy"`), provide `width`/`height` to prevent layout shift.
- **Bundle**: keep bundle size in check — audit with `vite-bundle-visualizer` before adding large deps.
- Avoid re-renders from unstable references in providers (memoize context value).

---

## 10. Accessibility (a11y)

- Semantic HTML first: `<button>` not `<div onClick>`, `<nav>` not `<div class="nav">`.
- All interactive elements keyboard-navigable. Visible focus states required — never `outline: none` without replacement.
- ARIA attributes only when native HTML semantics are insufficient.
- Color contrast ratio minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA).
- Form fields always have associated `<label>`. Use `htmlFor` + `id` or wrap label.
- Modal / dialog: trap focus inside while open, restore focus on close.
- `aria-live` regions for dynamic content (toasts, validation errors).

---

## 11. Security

- Never store sensitive data (tokens, secrets, PII) in `localStorage` or `sessionStorage` without encryption. Prefer `httpOnly` cookies managed server-side.
- Sanitize all user-generated content before rendering as HTML.
- Never concatenate user input into query strings or API paths — always encode.
- CSP headers configured at the server/CDN level.
- Dependency audit: run `npm audit` in CI. Do not ship known critical vulnerabilities.
- Auth tokens: short expiry + refresh flow. Invalidate on logout server-side.

---

## 12. Testing Strategy

```
Unit tests      → pure functions, utils, hooks (Vitest)
Integration     → components with real data flows (Testing Library)
E2E             → critical user paths: registration, login, payment (Playwright)
```

- Test behavior, not implementation. No snapshot tests for logic.
- Coverage target: 80%+ on `lib/` and `hooks/`. UI components: focus on interaction paths.
- Tests colocated with source: `Component.test.tsx` beside `Component.tsx`.
- Mock only external boundaries (API, browser APIs). Real React tree for component tests.

---

## 13. Code Quality & Tooling

- **ESLint**: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@typescript-eslint`. Zero warnings in CI.
- **Prettier**: enforced on commit via lint-staged. Non-negotiable formatting.
- **Husky**: pre-commit runs lint + type-check. Pre-push runs tests.
- **Absolute imports**: configure path aliases in `tsconfig.json` and Vite. No `../../..` imports.
- **Barrel files**: use `index.ts` for public API of a feature. Don't re-export everything indiscriminately.
- Magic values → named constants. No raw strings for status codes, route paths, or config values.

---

## 14. Styling (Tailwind)

- Tailwind utility classes for all styling. Custom CSS only when Tailwind cannot express the design.
- No inline `style` prop for layout/visual styling — use Tailwind classes.
- Use `cn()` (clsx + tailwind-merge) for conditional class composition.
- Design tokens (colors, spacing, breakpoints) defined in `tailwind.config.ts`. Never hardcode hex values in components.
- Responsive design is baseline: mobile-first. Verify at `sm`, `md`, `lg`, `xl` breakpoints before calling a feature done.
- Premium, calm visual style: spacing and hierarchy first; decoration last.

---

## 15. Routing

- Route definitions centralized in `src/app/router/routes.ts`.
- Path builder functions for all parameterized routes — no string concatenation at call sites.
- Lazy load all page components.
- Auth-guard routes with `RequireAuth` wrapper. Never trust frontend-only auth — backend validates every request.
- Frontend paths mirror backend paths with `/api` prefix removed for resource routes.

---

## 16. Git & Release Discipline

- Branch naming: `<type>/<scope>/<short-description>` (e.g. `feat/membership/member-list`).
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `refactor:`).
- No direct commits to `main`/`master`. Always PR with review.
- Never commit: `.env`, credentials, secrets, large binaries.
- Commits and pushes are **opt-in** — agents and tooling must not commit or push without explicit user instruction.
- PR description: what changed, why, how to test, screenshots for UI changes.

---

## 17. Environment & Configuration

- All environment variables prefixed `VITE_` for client exposure.
- No secrets in client bundle. API keys used server-side only.
- Separate `.env.development`, `.env.staging`, `.env.production`. Never commit `.env.production`.
- Feature flags via environment variables or a runtime config endpoint — not hardcoded conditionals.

---

## 18. Dependency Management

- Add dependency only when it clearly solves a real problem that custom code would handle worse.
- Prefer packages with active maintenance, TypeScript types, and small bundle footprint.
- Audit before adding: check bundle size (bundlephobia), last release date, open issues.
- Peer dependencies must be compatible with existing React version.
- Lock file (`package-lock.json` / `yarn.lock`) always committed.

---

## 19. Loading UX Patterns

Use the right loading pattern for the context — wrong choice degrades perceived performance significantly.

### Decision rules

| Scenario | Pattern | Reason |
|---|---|---|
| Initial page / route load | Skeleton screen | Preserves layout; reduces CLS |
| Data refetch / background refresh | Stale data + subtle spinner in corner | Don't block UI for data user already has |
| Form submit / mutation | Button loading state (`disabled` + spinner in button) | Keeps context; shows action in progress |
| Full-screen blocking operation | Overlay spinner + message | Only when navigation away would corrupt state |
| Infinite scroll / load-more | Inline spinner at list bottom | Clear affordance for more content coming |
| Paginated table refresh | Opacity fade on table body + spinner | Avoids layout jump; signals refresh |

### Skeleton screens

- Mirror the exact layout of the loaded content — column count, card shapes, text line widths.
- Use animated shimmer (`animate-pulse` in Tailwind) for perceived activity.
- Never show skeletons for more than 3–5 seconds — if load takes longer, show an error or retry option.
- Skeleton component structure should match real component structure 1:1 to avoid layout shift on hydration.

```tsx
// Good — skeleton mirrors real card layout
function MemberCardSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 p-4">
      <div className="rounded-full bg-gray-200 h-10 w-10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}
```

### Spinners

- Spinners only for short, indeterminate waits (< 2s expected).
- Always provide accessible label: `aria-label="Loading"` or `role="status"` with visually hidden text.
- Never use a full-page spinner for content that can be partially rendered.
- Button spinners: replace icon or label with spinner — never add spinner beside existing text (layout shift).

```tsx
// Good — button loading state
<button disabled={isPending} className="...">
  {isPending ? <Spinner className="h-4 w-4" aria-label="Saving..." /> : 'Save'}
</button>
```

### Error states

- Every loading state has a corresponding error state. Design both before shipping either.
- Provide retry action on failure — never a dead end.
- Use `react-error-boundary` with `fallbackRender` prop for per-section error recovery.

---

## 20. Dead Code Detection

Dead code accumulates silently and bloats the bundle. Detect and remove it continuously, not in cleanup sprints.

### Tooling

- **`knip`** — primary tool. Detects unused exports, files, dependencies, and devDependencies.
  ```bash
  npx knip
  ```
- **`vite-bundle-visualizer`** — visualize bundle composition. Run before and after adding large deps.
  ```bash
  npx vite-bundle-visualizer
  ```
- **TypeScript** — `noUnusedLocals: true` and `noUnusedParameters: true` in `tsconfig.json`. Catch dead locals at compile time.

### `knip` configuration (recommended)

```json
// knip.json
{
  "entry": ["src/main.tsx", "src/app/router/**/*.{ts,tsx}"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}"]
}
```

### Rules

- Run `knip` in CI. Fail the build on new unused exports in `src/lib/` and `src/features/`.
- Barrel files (`index.ts`) are the biggest dead-code risk — only re-export what external consumers actually use. Audit barrel exports quarterly.
- Deprecated code: delete it. Do not comment out or rename with `_deprecated` suffix — git history preserves it.
- Before removing an export, `grep` the codebase to confirm zero consumers — do not rely solely on TypeScript's unused checks (dynamic imports can fool them).
- When refactoring a feature, run `knip` after to confirm no orphaned helpers remain.

### TypeScript config additions

```json
// tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```
