# ideali-membership

Production-ready React app scaffold built with Vite, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` if your API is not served from the same origin as the
frontend. The login flow calls:

- `POST /api/identity/account/authenticate`
- `POST /api/identity/account/2fa/{twoFaToken}/verify`

## Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build locally
- `npm run typecheck` - run TypeScript without emitting files
