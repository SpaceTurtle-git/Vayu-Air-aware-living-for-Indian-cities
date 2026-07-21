# Render single-service patch — how to apply

This folder contains only the **new/changed files**. Drop them into your
existing repo at the same paths (overwriting), then commit & push to `main`.

## Files in this patch

| File | Action |
|---|---|
| `build.sh` (repo root) | **New.** Builds frontend, then installs backend + migrates. |
| `start.sh` (repo root) | **New.** Starts gunicorn, bound to Render's `$PORT`. |
| `render.yaml` (repo root) | **New, optional.** Infra-as-code version of the Render service config. |
| `backend/config/settings.py` | **Replace.** Adds `WHITENOISE_ROOT` (serves the built React app) + `CSRF_TRUSTED_ORIGINS`. |
| `backend/config/urls.py` | **Replace.** Adds a catch-all route so React Router paths (and `/`) serve the frontend. |
| `backend/config/frontend_views.py` | **New.** The view that serves `frontend/dist/index.html`. |
| `frontend/.env` | **Replace.** Now `VITE_API_BASE_URL=/api` (relative — same-origin, no CORS needed in prod). |
| `frontend/.env.development` | **New.** Keeps `npm run dev` pointing at `localhost:8000/api` for local dev. |

## Also delete
- `backend/build.sh` — superseded by the root `build.sh` (which now also builds
  the frontend). Keeping both would be confusing/wrong if Root Directory is
  ever set to `backend`.

## Render dashboard settings (matching your screenshot)

- **Root Directory**: leave **blank** (repo root) — the build needs to reach
  both `frontend/` and `backend/` from one place.
- **Build Command**: `./build.sh`
- **Start Command**: `./start.sh`
- **Branch**: `main`
- **Language/Runtime**: Python 3
- Keep your existing environment variables (`DATABASE_URL`,
  `DJANGO_SECRET_KEY`, `OPENWEATHER_API_KEY`, etc.) exactly as already filled in.
  Additionally make sure `DJANGO_DEBUG=False` is set for production.

That's it — **one Web Service**, no separate static site, deployed from `main`.
