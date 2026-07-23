# MyHealthyGlucose — Web Dashboard

Patient-facing web companion to the mobile app. Users sign in and view their
glucose logs, meals, medications, time-in-range, activity and AI insights in the
browser at **https://app.myhealthyglucose.com**.

Stack: **React 18 + Vite 5 + Tailwind 3 + Recharts + lucide-react** — matches the
mobile app so components and the data model port over directly.

## Local development

```bash
cd app-dashboard
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_ANON_KEY (anon key ONLY)
npm run dev                  # http://localhost:5173
```

## Build

```bash
npm run build     # outputs static site to app-dashboard/dist
npm run preview   # preview the production build locally
```

## Data

Currently renders mock data from `src/data/mock.js`. Each array mirrors the
records the mobile app writes, so wiring live data is a drop-in replacement:

1. Add your **anon** key to `.env.local` (never the service_role key).
2. Replace the imports in `src/App.jsx` with Supabase queries via
   `src/lib/supabase.js` (auth + `select` on your glucose/meals/meds tables).
3. Enable Row Level Security so each user only reads their own rows.

## Deployment — IMPORTANT

This repo already serves `myhealthyglucose.datasparktech.com` via **GitHub Pages**.
GitHub Pages allows only **one custom domain per repo** and serves files as-is
(no build step), so it **cannot** also host this Vite app on the app subdomain.

Use **Cloudflare Pages** instead (same repo, this subfolder, its own domain):

- Project → Connect to Git → `datasparktech/myhealthyglucose-updates`
- Root directory: `app-dashboard`
- Build command: `npm run build`
- Build output directory: `dist`
- Env var: `VITE_SUPABASE_ANON_KEY` (and `VITE_SUPABASE_URL`)
- Custom domain: `app.myhealthyglucose.com`

See `DEPLOYMENT.md` for step-by-step DNS instructions.
