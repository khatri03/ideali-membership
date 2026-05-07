### Frontend Folder Structure

├── public/
│   ├── src/
│   │   ├── app/                     # App bootstrap, providers, router
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx           # React Router v6 config
│   │   │   └── providers.tsx        # QueryClientProvider, auth, i18n providers
│   │   ├── assets/                  # Static assets (images, fonts, icons)
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui base primitives — DO NOT hand-edit these
│   │   │   └── shared/              # Shared composite components (PageHeader, DataTable, etc.)
│   │   ├── constants/               # Shared app-wide constants — no magic values in components
│   │   ├── features/                # Feature-sliced modules (see §7)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── membership/          # Plans, subscriptions, member roles
│   │   │   ├── billing/
│   │   │   ├── settings/
│   │   │   └── [feature]/
│   │   │       ├── api/             # TanStack Query hooks for this feature
│   │   │       ├── components/      # Feature-local components
│   │   │       ├── hooks/           # Feature-local hooks
│   │   │       ├── store/           # Feature-local Zustand slice (UI state only)
│   │   │       ├── types/           # Feature-local TypeScript types
│   │   │       └── index.ts         # Public barrel export only — no internal cross-feature imports
│   │   ├── hooks/                   # Global reusable hooks
│   │   ├── lib/                     # Third-party wrappers & config (axios instance, i18n setup, etc.)
│   │   ├── services/                # Global API client and service abstractions
│   │   │   ├── api.ts               # Axios instance with auth + correlation ID interceptors
│   │   │   └── auth.service.ts
│   │   ├── store/                   # Global Zustand stores
│   │   │   ├── auth.store.ts        # Access token (in memory only), user identity
│   │   │   └── ui.store.ts          # Sidebar, modals, global UI flags
│   │   ├── types/                   # Global TypeScript interfaces and enums
│   │   │   ├── api.types.ts         # ApiResponse<T>, PagedResult<T>, ApiError
│   │   │   └── domain.types.ts
│   │   └── utils/                   # Pure utility functions — no side effects, no feature imports
│   ├── .env.example                 # Always kept in sync — every VITE_ var documented here
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts