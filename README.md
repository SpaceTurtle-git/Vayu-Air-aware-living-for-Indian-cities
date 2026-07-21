# Vayu — Air-aware living for Indian cities

Vayu ("air/wind" in Sanskrit) is a full-stack app that lets a user log in,
save a location, and see:

- Current weather
- Current AQI + pollution breakdown (converted to the **Indian CPCB 0–500
  scale**, not the raw international index — because that's the scale
  Indians actually recognise)
- A **7-day AI-predicted** AQI/pollution forecast (scikit-learn model)
- A **route planner** that compares every route OpenRouteService offers between
  two points by *pollution exposure*, not just time — so someone with
  asthma, or a runner, can pick the cleaner-air path
- A **daily email** at a time the user picks, with today's weather, AQI,
  forecast, and their saved routes

Stack: **Django + Django REST Framework + SQLite/PostgreSQL** (backend),
**React + Vite + Tailwind** (frontend), built for deploy on **Render**
(backend, with PostgreSQL) + **Netlify** (frontend).

---

## 1. Get your API keys ready

You said you already have these — just confirm you have:

| Service | Used for | Get it at |
|---|---|---|
| OpenWeatherMap | Current weather + air pollution + forecast + history | https://openweathermap.org/api (the free tier's "One Call" / Air Pollution APIs are enough) |
| WAQI / AQICN | Optional cross-check against the nearest real ground station | https://aqicn.org/data-platform/token/ |
| OpenRouteService | Route alternatives for the pollution-comparison planner | https://openrouteservice.org/dev/#/signup — free, just an email signup, **no bank/card details required**, 2,000 requests/day, and it has dedicated walking/cycling/driving profiles |

For email, easiest option is Gmail + an **App Password** (not your normal
password): https://myaccount.google.com/apppasswords — requires 2FA turned
on for your Google account.

---

## 2. Backend setup (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now open .env and fill in:
#   DJANGO_SECRET_KEY      - any random long string
#   OPENWEATHER_API_KEY
#   WAQI_API_TOKEN
#   OPENROUTESERVICE_API_KEY
#   EMAIL_HOST_USER / EMAIL_HOST_PASSWORD  (Gmail app password)

python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

Backend now runs at `http://localhost:8000`. Try `http://localhost:8000/admin/`
to confirm it's up.

### Key backend files, if you want to extend anything
- `weather/aqi_utils.py` — the Indian AQI (CPCB) conversion formula, sub-index
  breakpoints, and the health-advisory text generator
- `weather/services.py` — all OpenWeatherMap + WAQI HTTP calls
- `predictions/ml_model.py` — the AI forecasting model (RandomForest +
  cold-start linear fallback) — see the big docstring at the top, it
  explains exactly why it's built this way
- `routes/services.py` — OpenRouteService call + per-route AQI sampling +
  scoring/ranking logic
- `notifications/services.py` + `notifications/management/commands/send_daily_emails.py`
  — the daily email pipeline

### Scheduling the daily email (important — this doesn't run itself)

The command is designed to run every 5–10 minutes and only actually emails
someone once their chosen time arrives:

```bash
python manage.py send_daily_emails
```

**Locally** (Linux/Mac), add to crontab (`crontab -e`):
```
*/10 * * * * cd /full/path/to/backend && /full/path/to/venv/bin/python manage.py send_daily_emails >> /tmp/vayu_email.log 2>&1
```

**On Render** (once deployed): create a separate **Cron Job** service
(not a Web Service) in the Render dashboard:
- Command: `python manage.py send_daily_emails`
- Schedule: `*/10 * * * *`
- Same repo, same environment variables as your web service

---

## 3. Frontend setup (React)

```bash
cd frontend
npm install

# create frontend/.env :
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

npm run dev
```

Opens at `http://localhost:5173`. Register an account, pick a location
(Mumbai/Delhi presets are built in, or type your own lat/lng), and you're
on the dashboard.

---

## 4. How the AI is actually used

Two places:

1. **AQI/pollution forecasting** (`predictions/ml_model.py`) — a
   `RandomForestRegressor` trained on cyclical time features (hour-of-day,
   day-of-week) plus recent pollutant readings, predicting the next 7 days.
   It trains on data cached every time a user's dashboard fetches a live
   reading (`AQIReading` table), blended with OpenWeatherMap's real 4-day
   forecast. Brand-new locations with little history fall back to a
   linear-trend extrapolation until enough real readings accumulate — so it
   never breaks, and gets more accurate the more the app is used.
2. **Route health scoring** — not a model per se, but an automated
   pollution-exposure score per route (avg + worst-point AQI across sampled
   points), which is what actually answers "which of these routes is
   healthiest for me right now."

If you'd rather plug in a hosted LLM (e.g. for a natural-language "what
should I do today given my asthma and today's AQI" assistant), the cleanest
spot is a new endpoint in `predictions/` that calls the Anthropic API with
the same context (`weather`, `aqi`, `health_profile`) already assembled in
`weather/views.py::DashboardView` — happy to wire that up if you want it.

---

## 5. Deploying

**Backend (Render, with PostgreSQL)**
1. Push the repo (including `backend/build.sh`) to GitHub.
2. Grab the **External Database URL** from your existing Postgres instance
   (Render/Supabase/Neon all give you one, format
   `postgresql://user:password@host:5432/dbname`).
3. Render Dashboard → New → Web Service → point at the repo, root directory
   `backend`.
4. Config:
   - **Runtime**: `Python`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
   - **Instance Type**: Free (or whatever fits)
5. Environment variables (Render's Environment tab — never commit `.env`):
   - `DATABASE_URL` — the Postgres URL from step 2
   - `DJANGO_SECRET_KEY` — generate a random one
   - `DJANGO_DEBUG` — `False`
   - `DJANGO_ALLOWED_HOSTS` — leave as-is; Render's own domain is added
     automatically via `RENDER_EXTERNAL_HOSTNAME`
   - `FRONTEND_ORIGIN` — your Netlify URL once you have it, e.g.
     `https://your-app.netlify.app`
   - `OPENWEATHER_API_KEY`, `WAQI_API_TOKEN`, `OPENROUTESERVICE_API_KEY`,
     `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`
6. Click **Create Web Service**. `build.sh` installs deps, runs
   `collectstatic`, and runs `migrate` against your Postgres database.
7. Add a second **Cron Job** service for `send_daily_emails` (see above),
   same repo/env vars, root directory `backend`.
8. Copy your live backend URL (e.g. `https://vayu-backend.onrender.com`).

**Frontend (Netlify)**
1. Push the repo to GitHub (the included root-level `netlify.toml` already
   sets the base directory to `frontend`, the build command to
   `npm run build`, and the publish directory to `dist`, plus the SPA
   redirect so client-side routes don't 404 on refresh — there's also a
   `frontend/public/_redirects` file doing the same, as a fallback).
2. Netlify Dashboard → Add new site → Import an existing project → pick the
   repo. Netlify should pick up `netlify.toml` automatically; if not, set
   Base directory to `frontend` manually.
3. Site configuration → Environment variables → add:
   - `VITE_API_BASE_URL` = `https://vayu-backend.onrender.com/api` (your
     Render URL from above, no trailing slash)
4. Click **Deploy site**.

**Database**: already wired up — `config/settings.py` reads `DATABASE_URL`
via `dj-database-url` and connects to Postgres when it's set, falling back
to local SQLite when it isn't (e.g. on your machine).

---

## 6. Project structure

```
backend/
  config/            Django settings, urls, wsgi
  accounts/           Auth + user Profile (location, health condition, email prefs)
  locations/          Saved places + AQIReading history cache
  weather/            OpenWeatherMap/WAQI calls + Indian AQI conversion
  predictions/        The ML forecasting model
  routes/             OpenRouteService + pollution-based route scoring
  notifications/      Daily email template + send command

frontend/
  src/
    api/client.js      Axios + JWT refresh
    context/            Auth state
    pages/              Login, Register, LocationSetup, Dashboard, RoutePlanner, Settings
    components/          WeatherCard, AqiCard, AqiHorizon (signature scale), PredictionChart, RouteMap, Navbar
```

## 7. What's a stub vs. production-ready right now

- **Real, working**: auth, AQI/weather fetching + caching, the ML forecast
  model, route comparison, saved routes, the email pipeline — all call real
  APIs once you drop your keys in `.env`.
- **Simplified for the MVP** (flagged in code comments where relevant):
  route point sampling is capped at 6 points/route to bound API calls;
  location search is preset-city buttons + manual lat/lng rather than a full
  places-autocomplete (swap in a free geocoder like OpenStreetMap Nominatim
  when you're ready — no API key needed); no password-reset flow yet.
