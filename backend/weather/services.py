"""
Thin wrappers around OpenWeatherMap (current weather + air pollution +
forecast) and WAQI/AQICN (India-specific ground-station AQI, used as a
cross-check where available). Every function returns plain dicts so views
and the prediction module don't need to know about HTTP.
"""
import requests
from datetime import datetime, timezone
from django.conf import settings
from .aqi_utils import compute_indian_aqi

OWM_BASE = "https://api.openweathermap.org/data/2.5"
WAQI_BASE = "https://api.waqi.info"


def get_current_weather(lat, lon):
    """Current temperature, humidity, wind, conditions from OpenWeatherMap."""
    resp = requests.get(f"{OWM_BASE}/weather", params={
        "lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric",
    }, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return {
        "temp_c": data["main"]["temp"],
        "feels_like_c": data["main"]["feels_like"],
        "humidity_pct": data["main"]["humidity"],
        "wind_speed_ms": data["wind"]["speed"],
        "condition": data["weather"][0]["main"],
        "description": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"],
        "city_name": data.get("name", ""),
        "observed_at": datetime.fromtimestamp(data["dt"], tz=timezone.utc).isoformat(),
    }


def get_air_pollution_current(lat, lon):
    """Current pollutant concentrations -> converted to Indian AQI scale."""
    resp = requests.get(f"{OWM_BASE}/air_pollution", params={
        "lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY,
    }, timeout=10)
    resp.raise_for_status()
    item = resp.json()["list"][0]
    comps = item["components"]
    indian_aqi = compute_indian_aqi(
        pm25=comps.get("pm2_5"), pm10=comps.get("pm10"),
        no2=comps.get("no2"), o3=comps.get("o3"),
    )
    return {
        "timestamp": datetime.fromtimestamp(item["dt"], tz=timezone.utc).isoformat(),
        "components": comps,
        **(indian_aqi or {}),
    }


def get_air_pollution_forecast(lat, lon):
    """OpenWeatherMap gives ~4 days of hourly forecast for free — this is
    our 'ground truth near-term' signal that the ML model in `predictions`
    blends with a longer-range statistical trend."""
    resp = requests.get(f"{OWM_BASE}/air_pollution/forecast", params={
        "lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY,
    }, timeout=10)
    resp.raise_for_status()
    out = []
    for item in resp.json()["list"]:
        comps = item["components"]
        indian_aqi = compute_indian_aqi(
            pm25=comps.get("pm2_5"), pm10=comps.get("pm10"),
            no2=comps.get("no2"), o3=comps.get("o3"),
        )
        out.append({
            "timestamp": datetime.fromtimestamp(item["dt"], tz=timezone.utc).isoformat(),
            "aqi": indian_aqi["aqi"] if indian_aqi else None,
            "category": indian_aqi["category"] if indian_aqi else None,
            "pm25": comps.get("pm2_5"),
            "pm10": comps.get("pm10"),
        })
    return out


def get_air_pollution_history(lat, lon, start_ts, end_ts):
    """Up to a few days of historical hourly data — feeds the prediction model."""
    resp = requests.get(f"{OWM_BASE}/air_pollution/history", params={
        "lat": lat, "lon": lon, "start": int(start_ts), "end": int(end_ts),
        "appid": settings.OPENWEATHER_API_KEY,
    }, timeout=10)
    resp.raise_for_status()
    out = []
    for item in resp.json().get("list", []):
        comps = item["components"]
        indian_aqi = compute_indian_aqi(
            pm25=comps.get("pm2_5"), pm10=comps.get("pm10"),
            no2=comps.get("no2"), o3=comps.get("o3"),
        )
        out.append({
            "timestamp": datetime.fromtimestamp(item["dt"], tz=timezone.utc).isoformat(),
            "aqi": indian_aqi["aqi"] if indian_aqi else None,
            "pm25": comps.get("pm2_5"),
            "pm10": comps.get("pm10"),
        })
    return out


def get_waqi_station_aqi(lat, lon):
    """Optional cross-check against the nearest real CPCB/WAQI ground
    station (India has good WAQI coverage in most metros). Returns None
    quietly if no token is set or no station is nearby, so the dashboard
    always has the OpenWeatherMap-derived AQI as a fallback."""
    if not settings.WAQI_API_TOKEN:
        return None
    try:
        resp = requests.get(f"{WAQI_BASE}/feed/geo:{lat};{lon}/", params={
            "token": settings.WAQI_API_TOKEN,
        }, timeout=8)
        data = resp.json()
        if data.get("status") != "ok":
            return None
        d = data["data"]
        return {
            "station_name": d.get("city", {}).get("name"),
            "aqi": d.get("aqi"),
            "dominant_pollutant": d.get("dominentpol"),
            "measured_at": d.get("time", {}).get("s"),
        }
    except requests.RequestException:
        return None
