"""
Compares route alternatives between two points by *pollution exposure*,
not just time/distance — so someone with asthma, or a runner, can pick
the cleaner-air route instead of the fastest one.

Uses OpenRouteService (ORS) instead of Google Directions: ORS's free tier
needs only an email signup (no bank card), gives 2,000 requests/day, and
has dedicated walking/cycling/driving profiles — a better fit here than
Google anyway, since the asthma/jogging use case cares about foot routes.
Sign up free at https://openrouteservice.org/dev/#/signup and put the key
in OPENROUTESERVICE_API_KEY in backend/.env.
"""
import requests
from django.conf import settings

from weather.services import get_air_pollution_current
from weather.aqi_utils import AQI_CATEGORIES

ORS_BASE = "https://api.openrouteservice.org/v2/directions"
SAMPLE_POINTS_PER_ROUTE = 6  # keep external AQI API calls bounded

MODE_TO_PROFILE = {
    "walking": "foot-walking",
    "bicycling": "cycling-regular",
    "driving": "driving-car",
}


def _category_for(aqi_value):
    for lo, hi, label, color in AQI_CATEGORIES:
        if lo <= aqi_value <= hi:
            return label, color
    return "Severe", "#8B2E4C"


def _sample_points(coords, n):
    if len(coords) <= n:
        return coords
    step = (len(coords) - 1) / (n - 1)
    return [coords[round(i * step)] for i in range(n)]


def _format_distance(meters):
    km = meters / 1000
    return f"{km:.1f} km" if km >= 1 else f"{int(meters)} m"


def _format_duration(seconds):
    minutes = seconds / 60
    if minutes < 60:
        return f"{round(minutes)} min"
    hours = int(minutes // 60)
    rem = round(minutes % 60)
    return f"{hours} hr {rem} min" if rem else f"{hours} hr"


def _call_ors(profile, start_lat, start_lng, end_lat, end_lng, want_alternatives=True):
    body = {
        "coordinates": [[start_lng, start_lat], [end_lng, end_lat]],
        "instructions": False,
    }
    if want_alternatives:
        body["alternative_routes"] = {"target_count": 3, "share_factor": 0.6, "weight_factor": 1.4}

    resp = requests.post(
        f"{ORS_BASE}/{profile}/geojson",
        json=body,
        headers={
            "Authorization": settings.OPENROUTESERVICE_API_KEY,
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    return resp


def get_route_options(start_lat, start_lng, end_lat, end_lng, mode="walking"):
    profile = MODE_TO_PROFILE.get(mode, "foot-walking")

    resp = _call_ors(profile, start_lat, start_lng, end_lat, end_lng, want_alternatives=True)
    if resp.status_code == 400:
        resp = _call_ors(profile, start_lat, start_lng, end_lat, end_lng, want_alternatives=False)

    if resp.status_code != 200:
        try:
            detail = resp.json().get("error", {}).get("message", resp.text[:200])
        except ValueError:
            detail = resp.text[:200]
        return {"error": detail or f"ORS error {resp.status_code}", "routes": []}

    data = resp.json()
    features = data.get("features", [])
    if not features:
        return {"error": "No route found between these points", "routes": []}

    routes = []
    for idx, feature in enumerate(features):
        lonlat_coords = feature["geometry"]["coordinates"]
        coords = [(lat, lon) for lon, lat in lonlat_coords]
        sample = _sample_points(coords, SAMPLE_POINTS_PER_ROUTE)

        aqi_values = []
        sampled_points = []
        for lat, lng in sample:
            try:
                aqi_data = get_air_pollution_current(lat, lng)
                aqi_val = aqi_data.get("aqi")
            except requests.RequestException:
                aqi_val = None
            if aqi_val is not None:
                aqi_values.append(aqi_val)
            sampled_points.append({"lat": lat, "lng": lng, "aqi": aqi_val})

        summary = feature["properties"]["summary"]
        avg_aqi = round(sum(aqi_values) / len(aqi_values)) if aqi_values else None
        worst_aqi = max(aqi_values) if aqi_values else None
        category, color = (_category_for(avg_aqi) if avg_aqi is not None else ("Unknown", "#999999"))

        routes.append({
            "summary": f"Option {idx + 1}",
            "distance_text": _format_distance(summary["distance"]),
            "duration_text": _format_duration(summary["duration"]),
            "polyline": [[lat, lng] for lat, lng in coords],
            "sampled_points": sampled_points,
            "avg_aqi": avg_aqi,
            "worst_aqi": worst_aqi,
            "category": category,
            "color": color,
        })

    routes.sort(key=lambda r: (r["avg_aqi"] is None, r["avg_aqi"]))
    for i, r in enumerate(routes):
        r["recommended"] = (i == 0 and r["avg_aqi"] is not None)

    return {"error": None, "routes": routes}
