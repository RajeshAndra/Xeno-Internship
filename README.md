## Xeno - Shopify Insights Platform

A full-stack monorepo with an Express backend (Sequelize + SQLite) and a Next.js + Tailwind frontend. The app provides analytics dashboards (customers, products, revenue) with authentication.

### Monorepo layout

```
.
├─ backend/           # Express API (Sequelize, SQLite)
│  ├─ src/            # API source code (server, routes, models)
│  ├─ scripts/        # DB migrate/seed scripts
│  └─ package.json
├─ frontend/          # Next.js dashboard UI (Tailwind)
│  └─ package.json
└─ README.md
```

### Tech stack
- Backend: Node.js, Express, Sequelize ORM, SQLite (dev), JWT, Joi, Helmet, CORS
- Frontend: Next.js 14, React 18, Tailwind CSS

---

### Prerequisites
- Node.js 18+
- npm 9+ (bundled with Node 18)

Optional:
- Railway or Render account (backend deploy)
- Vercel account (frontend deploy)

---

### Environment variables

Backend (`backend/.env`):

```
NODE_ENV=development
PORT=4000
JWT_SECRET=replace-with-a-strong-secret
# For SQLite (default) no DSN needed; Sequelize uses database.sqlite in backend/
# If you switch to Postgres/MySQL, add a DSN like:
# DATABASE_URL=postgres://user:pass@host:5432/db
# Allow your frontend origin (local or Vercel)
CORS_ORIGIN=http://localhost:3001
```

Frontend (`frontend/.env.local`):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## How to run locally

You can use the root scripts or run in each package.

#### Option A: Using root scripts

```
# From repo root
npm run setup        # installs all deps and runs db:migrate + db:seed
npm run dev          # runs backend and frontend together
```

Backend API will be on http://localhost:4000 and frontend on http://localhost:3001.

#### Option B: Manual in each package

Backend:
```
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

---

## Database commands

Available via backend and also proxied at repo root:

- Run migrations:
```
# from repo root
npm run db:migrate
# or inside backend/
cd backend && npm run db:migrate
```

- Seed data:
```
# from repo root
npm run db:seed
# or inside backend/
cd backend && npm run db:seed
```

- Setup (migrate + seed):
```
# from repo root
npm run db:setup
# or inside backend/
cd backend && npm run db:setup
```

---

## Production builds

Backend:
```
cd backend
npm install
npm run db:migrate
npm run db:seed
npm start
```

Frontend:
```
cd frontend
npm install
npm run build
npm start
```

---

## Deployment

### Option A: Backend on Railway, Frontend on Vercel
1. Push this repository to GitHub.
2. Backend (Railway):
   - New Project -> Deploy from GitHub -> select repo, set root to `backend`.
   - Use existing Dockerfile or Nixpacks.
   - Set env vars: `PORT`, `JWT_SECRET`, `CORS_ORIGIN`.
   - Deploy and copy the public backend URL.
3. Frontend (Vercel):
   - Import from GitHub -> root directory `frontend`.
   - Build command `npm run build` (auto-detected for Next.js).
   - Env var: `NEXT_PUBLIC_API_BASE_URL` = your Railway backend URL.
   - Deploy and (optionally) add a custom domain.
4. If CORS blocks requests, update backend `CORS_ORIGIN` to your Vercel domain and redeploy.

### Option B: Backend on Render, Frontend on Vercel
1. Backend (Render): New Web Service, root `backend`.
   - Build Command: `npm i`
   - Start Command: `npm start` (or select Dockerfile)
   - Env vars: `PORT`, `JWT_SECRET`, `CORS_ORIGIN`
2. Frontend: same as Vercel steps above, set `NEXT_PUBLIC_API_BASE_URL` to the Render URL.

---

## Troubleshooting
- 404/Network errors: confirm `NEXT_PUBLIC_API_BASE_URL` and check the browser Network tab.
- CORS blocked: ensure backend `CORS_ORIGIN` includes your frontend origin.
- DB issues: re-run `npm run db:migrate` and `npm run db:seed` in `backend/`.
- Node version: use Node 18+ (required by both packages).

---

## How it works (high level)
- Backend exposes JWT-protected REST endpoints and persists data via Sequelize to `backend/database.sqlite` in development.
- Frontend authenticates via the backend and renders dashboards. API calls use Axios to `NEXT_PUBLIC_API_BASE_URL`.
- UI uses Tailwind; left navigation is fixed on desktop and the main content uses full-height layout.


