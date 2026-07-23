# Deploying app.myhealthyglucose.com

The dashboard is a **Vite build** (it needs `npm run build` to produce static
files). GitHub Pages on this repo is already taken by
`myhealthyglucose.datasparktech.com` and can't run a build or host a second
custom domain — so we deploy with **Cloudflare Pages**, which builds the
`app-dashboard/` subfolder and serves it on the subdomain. The existing GitHub
Pages site is untouched.

## Step 1 — Push this folder to GitHub

The project lives in `app-dashboard/` on the `main` branch of
`datasparktech/myhealthyglucose-updates`. Commit and push it.

## Step 2 — Create the Cloudflare project (Workers Builds)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a
   repository** (or "Create a Worker" → Connect to Git).
2. Authorize GitHub and pick **`datasparktech/myhealthyglucose-updates`**
   (NOT `MyHealthyGlucose` — that's the marketing site).
3. Build settings:
   - **Production branch:** `main`
   - **Root directory / project path:** `app-dashboard`
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - The included `wrangler.jsonc` serves the built `dist/` as static assets
     with SPA fallback — no extra output-dir setting needed.
4. **Environment variables:**
   - `VITE_SUPABASE_URL` = `https://ubvoyjjutkjwcoyshtpd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = your **anon** key (public — safe in the browser)
5. **Save and Deploy.** You'll get a `*.workers.dev` URL to verify.

## Step 3 — Attach the subdomain

In the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom
domain** → `app.myhealthyglucose.com`.

- If `myhealthyglucose.com`'s DNS is **on Cloudflare**, it adds the CNAME
  automatically — done.
- If DNS is **elsewhere** (registrar, Route 53, etc.), add this record there:

  | Type  | Name  | Value                                   |
  | ----- | ----- | --------------------------------------- |
  | CNAME | `app` | `<your-project>.pages.dev`              |

  (Use the exact `pages.dev` hostname Cloudflare shows you.)

Propagation is usually minutes. HTTPS is issued automatically.

## Alternative: Vercel

Same idea if you prefer Vercel — Import the repo, set **Root Directory** to
`app-dashboard`, add the two env vars, then add `app.myhealthyglucose.com` under
the project's Domains and follow its CNAME instruction.

## Do NOT

- Do **not** add `app.myhealthyglucose.com` as a GitHub Pages custom domain on
  this repo — it would collide with the existing `datasparktech.com` site and
  wouldn't build the app anyway.
- Do **not** put the Supabase **service_role** key in env vars here or anywhere
  client-side.
