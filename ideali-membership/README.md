# ideali-membership

Production-ready React app scaffold built with Vite, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` if your API is not served from the same
origin as the frontend. The login flow calls:

- `POST /api/identity/account/authenticate`
- `POST /api/identity/account/2fa/{twoFaToken}/verify`

To launch the public membership registration form from the app root, set
`VITE_DEFAULT_MEMBERSHIP_TYPE_UNIQUE_ID` in `.env` to the membership type
unique id you want to expose.

## Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build locally
- `npm run typecheck` - run TypeScript without emitting files
