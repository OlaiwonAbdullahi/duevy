# Duevy Frontend

Web app for **Duevy** — a dues collection platform for Nigerian university departments/classes. Lets department reps create dues, collect payments, manage payouts, run polls, and handle disputes; lets students/members join their department space and pay dues. Includes an admin dashboard and an AI chat assistant ("Duey").

Built with [Next.js](https://nextjs.org) (App Router) and talks to the [duevy-backend](../duevy-backend) API.

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI components**: [shadcn/ui](https://ui.shadcn.com) (Radix primitives) + [Hugeicons](https://hugeicons.com) / lucide-react
- **Animation**: Motion (Framer Motion successor), Lenis (smooth scroll)
- **Other**: jsPDF (client-side PDF export), next-themes (dark mode), sonner (toasts), `nigerian-universities` (institution data)

## Prerequisites

- Node.js **20+** and npm
- The [duevy-backend](../duevy-backend) API running locally (or a deployed instance you can point at)

## Setup

### 1. Install dependencies

```bash
cd duevy
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/v1
NEXT_PUBLIC_LOGO_DEV_TOKEN=your_logo_dev_token
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the backend API, **including** the `/v1` prefix. Point this at your local backend (`http://localhost:3000/v1`) or a deployed one. |
| `NEXT_PUBLIC_LOGO_DEV_TOKEN` | Yes | Public token from [logo.dev](https://logo.dev) — used to fetch bank logos on the payout screen (`app/(dashboards)/dashboard/payout/_components/BankLogo.tsx`). |

Both are `NEXT_PUBLIC_*` and get inlined at build time, per Next.js convention.

### 3. Run the dev server

The backend defaults to port `3000` and its `FRONTEND_URL`/`CORS_ORIGINS` config expects this app on port `3001` — since both projects default to `3000`, run this one on `3001` explicitly to avoid a clash and keep CORS/cookies working:

```bash
npm run dev -- -p 3001
```

The app will be at [http://localhost:3001](http://localhost:3001). (If you use a different port, update `FRONTEND_URL` and `CORS_ORIGINS` in the backend's `.env` to match.)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | Lint with ESLint |

## Project Structure

```
app/
├── (auth)/                # login, signup, verify-email, forgot/reset password
├── (dashboards)/
│   ├── dashboard/          # member/rep dashboard — dues, wallet, payouts, polls, assistant, disputes
│   └── admin/               # admin dashboard
├── api/                     # Next.js route handlers (e.g. wallet callback)
├── vote/                    # public poll voting pages
├── privacy/, terms/          # static pages
└── layout.tsx, page.tsx       # root layout + landing page

components/          # shared UI components (shadcn-based)
lib/
├── api/               # typed API client — one file per backend resource
├── auth/               # auth context/provider
└── hooks/              # shared React hooks

docs/
├── API_SPECIFICATION.md      # full backend API reference
├── FRONTEND_API_GUIDE.md      # how this app talks to the backend
└── ASSISTANT_API_GUIDE.md      # Duey (AI assistant) integration
```

`lib/api/client.ts` is the shared HTTP client; every resource in `lib/api/` (auth, dues, spaces, payouts, polls, wallet, assistant, etc.) wraps it with typed request/response shapes matching the backend.

## UI components (shadcn)

This project uses shadcn/ui with the `radix-maia` style and Hugeicons as the icon set (see `components.json`). Add new components with:

```bash
npx shadcn@latest add <component>
```

## Notes

- The API client expects the backend's `/v1`-prefixed routes and relies on cookies for auth (the backend sets JWT cookies) — make sure `NEXT_PUBLIC_API_BASE_URL` and the backend's `CORS_ORIGINS`/`FRONTEND_URL` are consistent so cookies survive cross-origin requests in dev.
- See [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md) for the full backend API contract this app is built against.
