"""
The "AI" layer: a lightweight scikit-learn model that forecasts AQI/pollution
for the next 7 days at a user's location.

Why not just use the OpenWeatherMap forecast directly? OWM's free air
pollution forecast only covers ~4 days. We:
  1. Pull whatever real history we have cached in AQIReading (populated
     every time a user opens their dashboard) plus the 4-day OWM forecast.
  2. Train a small RandomForestRegressor on time-based + pollutant features
     to capture daily/weekly seasonality (e.g. weekday traffic pollution
     vs weekend dip, morning/evening peaks).
  3. Roll the model forward day-by-day for the remaining forecast horizon.

With little historical data (a new location) it gracefully falls back to a
linear trend fit (numpy polyfit) over whatever points are available, so it
never crashes on a cold start — it just gets more accurate the more a user
returns.
"""
import math
from datetime import datetime, timedelta, timezone
import numpy as np

from locations.models import AQIReading
from weather.services import get_air_pollution_forecast
from weather.aqi_utils import AQI_CATEGORIES

MIN_ROWS_FOR_ML = 20


def _category_for(aqi_value):
    for lo, hi, label, color in AQI_CATEGORIES:
        if lo <= aqi_value <= hi:
            return label, color
    return "Severe", "#8B2E4C"


def _featurize(dt: datetime, pm25, pm10):
    hour = dt.hour
    dow = dt.weekday()
    return [
        math.sin(2 * math.pi * hour / 24), math.cos(2 * math.pi * hour / 24),
        math.sin(2 * math.pi * dow / 7), math.cos(2 * math.pi * dow / 7),
        pm25 or 0.0, pm10 or 0.0,
    ]


def _gather_training_rows(lat, lon):
    since = datetime.now(timezone.utc) - timedelta(days=10)
    qs = AQIReading.objects.filter(
        latitude__gte=lat - 0.05, latitude__lte=lat + 0.05,
        longitude__gte=lon - 0.05, longitude__lte=lon + 0.05,
        timestamp__gte=since,
    ).order_by("timestamp")
    rows = list(qs)

    # Always blend in the live 4-day forecast as extra "known future" training signal
    try:
        forecast = get_air_pollution_forecast(lat, lon)
    except Exception:
        forecast = []

    X, y, timestamps = [], [], []
    for r in rows:
        X.append(_featurize(r.timestamp, r.pm25, r.pm10))
        y.append(r.aqi_in)
        timestamps.append(r.timestamp)
    for f in forecast:
        if f["aqi"] is None:
            continue
        dt = datetime.fromisoformat(f["timestamp"])
        X.append(_featurize(dt, f["pm25"], f["pm10"]))
        y.append(f["aqi"])
        timestamps.append(dt)

    return np.array(X), np.array(y), timestamps


def forecast_daily_aqi(lat, lon, days=7):
    """Returns a list of `days` dicts: date, predicted_aqi, category, color,
    pm25_est, pm10_est, method ('ml' or 'trend-fallback')."""
    X, y, timestamps = _gather_training_rows(lat, lon)
    now = datetime.now(timezone.utc)
    results = []

    if len(X) >= MIN_ROWS_FOR_ML:
        from sklearn.ensemble import RandomForestRegressor
        model = RandomForestRegressor(n_estimators=150, max_depth=6, random_state=42)
        model.fit(X, y)

        last_pm25 = y[-1]  # rough persistence estimate for pollutant inputs
        for d in range(1, days + 1):
            target_dt = now + timedelta(days=d)
            # average a few hours across the day for a stabler daily figure
            day_preds = []
            for hour in (8, 13, 18, 22):
                sample_dt = target_dt.replace(hour=hour, minute=0, second=0, microsecond=0)
                feats = _featurize(sample_dt, last_pm25, last_pm25 * 1.6)
                day_preds.append(model.predict([feats])[0])
            predicted = float(np.mean(day_preds))
            category, color = _category_for(predicted)
            results.append({
                "date": target_dt.date().isoformat(),
                "predicted_aqi": round(predicted),
                "category": category,
                "color": color,
                "method": "ml",
            })
        return results

    # --- Cold-start fallback: simple linear trend over whatever we have ---
    if len(y) >= 2:
        t0 = timestamps[0]
        x_days = np.array([(t - t0).total_seconds() / 86400 for t in timestamps])
        coeffs = np.polyfit(x_days, y, deg=1)
        last_day_offset = x_days[-1]
        base = y[-1]
        for d in range(1, days + 1):
            predicted = float(np.polyval(coeffs, last_day_offset + d))
            predicted = max(5.0, predicted)  # AQI floor
            category, color = _category_for(predicted)
            results.append({
                "date": (now + timedelta(days=d)).date().isoformat(),
                "predicted_aqi": round(predicted),
                "category": category,
                "color": color,
                "method": "trend-fallback",
            })
        return results

    # --- Nothing at all yet: return None so the view can say "check back tomorrow" ---
    return []
