# veo_services_mono

Turborepo monorepo containing a **Next.js** frontend (`apps/web`) and a **NestJS** API (`apps/api`).

## Requirements

- **Node.js** 20 or newer (matches `engines` in the root `package.json`)
- **npm** 10.x (declared in `packageManager` for Turborepo and reproducible installs)

## Repository layout

| Path        | Description                                      |
| ----------- | ------------------------------------------------ |
| `apps/web`  | Next.js app (default dev server: port **3000**)  |
| `apps/api`  | NestJS app (default dev server: port **3001**) |
| `turbo.json`| Turborepo pipeline (`build`, `dev`, `lint`, …)   |

## Install dependencies

From the **repository root** (where this `README.md` lives):

```bash
npm install
```

npm workspaces install and link `web` and `api` together from the root lockfile.

## Run locally

### All apps (recommended for full-stack work)

```bash
npm run dev
```

Turborepo runs `dev` in every workspace in parallel:

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001) (see `apps/api/src/main.ts`; override with `PORT`)

### Single app

```bash
npm run dev --workspace=web
npm run dev --workspace=api
```

### Other root scripts

```bash
npm run build   # turbo run build — builds web + api
npm run lint    # turbo run lint
npm run start   # turbo run start — production-style starts (run after build)
```

### Production-style run (after build)

```bash
npm run build
npm run start --workspace=web   # Next.js production server
npm run start --workspace=api   # Nest (non-watch); for production you normally use `start:prod` in the API workspace
```

For the API in production, prefer:

```bash
npm run build --workspace=api
npm run start:prod --workspace=api
```

## Environment variables

- **API**: Set `PORT` if you cannot use the default `3001`.
- **Web**: When the UI calls the API, use a URL from configuration (for example `NEXT_PUBLIC_API_URL=http://localhost:3001`) and read it in the client or server code as needed. Keep secrets out of `NEXT_PUBLIC_*` variables; those are exposed to the browser.

Create `.env.local` in `apps/web` and/or `.env` in `apps/api` as required. Do not commit real secrets; add patterns to `.gitignore` if you introduce new env files.

## Deploying to Vercel

### What Vercel hosts well

- **Next.js (`apps/web`)** — first-class support: static and server features, edge, preview deployments, analytics, etc.

### What does not map 1:1 to classic Vercel hosting

- **NestJS (`apps/api`)** is built for a **long-running Node HTTP server**. Vercel is optimized for **serverless functions** and frameworks that fit that model. Running the full Nest app “as on your laptop” on Vercel usually means either:

  1. **Hosting the API elsewhere** (common and straightforward): e.g. [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), [Google Cloud Run](https://cloud.google.com/run), AWS ECS/Fargate, etc., **or**
  2. **Adapting Nest to serverless** on Vercel (more work: custom entry, cold starts, request limits, no persistent WebSocket server the same way as on a VM).

This README focuses on **deploying the Next.js app to Vercel** and **pointing it at your API URL** (whether the API is on another host or you later add a serverless Nest setup).

---

### Option A — Vercel dashboard (Git integration)

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In [Vercel](https://vercel.com), **Add New Project** and import the repository.
3. Configure the project:

   | Setting            | Value |
   | ------------------ | ----- |
   | **Framework Preset** | Next.js |
   | **Root Directory**   | `apps/web` |
   | **Install Command**  | `cd ../.. && npm ci` (or `cd ../.. && npm install` if you do not use `npm ci`) |
   | **Build Command**    | `cd ../.. && npx turbo run build --filter=web` |

   Vercel will infer the Next.js **Output**; you normally do not set it manually for App Router.

4. **Node.js version**: In Project → Settings → General, set **Node.js Version** to **20.x** (or newer if you standardize on it), aligned with `engines` in the root `package.json`.

5. Add **Environment Variables** in Vercel (Production / Preview / Development as needed), e.g.:

   - `NEXT_PUBLIC_API_URL` — public base URL of your deployed API (no trailing slash unless your code expects it).

6. Deploy. Every push to the connected branch can trigger Preview or Production builds depending on your Git integration settings.

**Why `cd ../..`?** With **Root Directory** `apps/web`, Vercel’s default install/build would only see the web app folder. Installing from the **monorepo root** ensures workspace dependencies and Turborepo resolve correctly.

---

### Option B — Vercel CLI

Install the CLI and link from the repo root (or deploy with explicit settings):

```bash
npm i -g vercel
cd /path/to/veo_services_mono
vercel
```

For a monorepo, prefer linking **one Vercel project per app** you actually deploy (here: `web`). When prompted, set root to `apps/web` and use the same **Install** / **Build** commands as in Option A, or manage them in the dashboard after the first deploy.

To production deploy:

```bash
vercel --prod
```

(Exact flags depend on your linked project; `vercel link` helps align local and remote settings.)

---

### Turborepo remote cache (optional)

To speed up CI and Vercel builds with [Turborepo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching):

1. Sign in at [Vercel](https://vercel.com) (remote cache is tied to Turborepo + Vercel).
2. Add `TURBO_TEAM` and `TURBO_TOKEN` (or follow the current Turborepo docs for the exact variable names your Turbo version expects) to your Vercel project **and** to any CI that runs `turbo run build`.

This is optional; local and Vercel builds work without it.

---

### CORS (if the browser calls the API directly)

If the Next.js app in the browser requests your API on another origin, configure **CORS** in Nest (e.g. `app.enableCors({ origin: ['https://your-app.vercel.app'] })`) or route API calls through Next.js **Route Handlers** / **server actions** so the browser only talks to your Vercel domain.

## Additional notes

- **Single Git repository**: Keep one `.git` at the monorepo root; avoid nested `.git` folders inside `apps/*`.
- **Lockfile**: Commit `package-lock.json` at the root so installs are reproducible in CI and on Vercel (`npm ci`).
- **API port locally**: Default API port is **3001** so it does not clash with Next on **3000**.
- **Filtering Turbo**: From the repo root you can run tasks for one package, e.g. `npx turbo run build --filter=web` or `--filter=api`.
- **Health check**: After deploying the API elsewhere, verify with something like `curl https://your-api-host/` (adjust path if you change the Nest root route).

## Troubleshooting

| Issue | What to check |
| ----- | ------------- |
| `turbo` cannot resolve workspaces | Root `package.json` must include `packageManager` (e.g. `npm@10.2.1`) and correct `workspaces`. |
| Vercel build cannot find dependencies | Install command must run from monorepo root (`cd ../.. && npm ci`) when Root Directory is `apps/web`. |
| API unreachable from production web | `NEXT_PUBLIC_API_URL`, HTTPS, CORS, and firewall / deployment region. |

## License

Private monorepo — adjust this section if you open-source the project.
