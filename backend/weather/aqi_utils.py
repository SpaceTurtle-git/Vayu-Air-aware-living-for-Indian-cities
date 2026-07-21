"""
Convert pollutant concentrations into the Indian National AQI (CPCB) scale,
which is what people in India actually recognise (0-500, "Good" to
"Severe") — rather than the raw OpenWeatherMap 1-5 index.

Breakpoints are the official CPCB sub-index breakpoints (24h avg for most
pollutants; simplified here to work off instantaneous concentrations, which
is a reasonable approximation for a dashboard, not a regulatory tool).
"""

# (C_low, C_high, I_low, I_high) per pollutant, ug/m3 except CO in mg/m3
BREAKPOINTS = {
    "pm25": [
        (0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200),
        (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500),
    ],
    "pm10": [
        (0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200),
        (251, 350, 201, 300), (351, 430, 301, 400), (431, 600, 401, 500),
    ],
    "no2": [
        (0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200),
        (181, 280, 201, 300), (281, 400, 301, 400), (401, 1000, 401, 500),
    ],
    "o3": [
        (0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200),
        (169, 208, 201, 300), (209, 748, 301, 400), (749, 1000, 401, 500),
    ],
}

AQI_CATEGORIES = [
    (0, 50, "Good", "#4CBB6C"),
    (51, 100, "Satisfactory", "#A0C93D"),
    (101, 200, "Moderate", "#F4C542"),
    (201, 300, "Poor", "#F08A3C"),
    (301, 400, "Very Poor", "#E24A4A"),
    (401, 500, "Severe", "#8B2E4C"),
]


def _sub_index(pollutant, concentration):
    if concentration is None:
        return None
    table = BREAKPOINTS[pollutant]
    for c_lo, c_hi, i_lo, i_hi in table:
        if c_lo <= concentration <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (concentration - c_lo) + i_lo, 1)
    # above the top breakpoint -> clamp to max
    return table[-1][3]


def compute_indian_aqi(pm25=None, pm10=None, no2=None, o3=None):
    """Returns dict with overall AQI (max of sub-indices, per CPCB method),
    the dominant pollutant, category label, and colour for the UI."""
    sub_indices = {
        "pm25": _sub_index("pm25", pm25),
        "pm10": _sub_index("pm10", pm10),
        "no2": _sub_index("no2", no2),
        "o3": _sub_index("o3", o3),
    }
    valid = {k: v for k, v in sub_indices.items() if v is not None}
    if not valid:
        return None
    dominant = max(valid, key=valid.get)
    aqi = valid[dominant]
    for lo, hi, label, color in AQI_CATEGORIES:
        if lo <= aqi <= hi:
            return {
                "aqi": round(aqi),
                "category": label,
                "color": color,
                "dominant_pollutant": dominant,
                "sub_indices": sub_indices,
            }
    return {"aqi": round(aqi), "category": "Severe", "color": "#8B2E4C",
            "dominant_pollutant": dominant, "sub_indices": sub_indices}


def health_advisory(aqi_value, health_profile="general"):
    """Short, plain-language guidance tuned to the user's health profile."""
    if aqi_value is None:
        return "No data available."
    sensitive = health_profile in ("asthma", "heart", "child_elderly")
    athlete = health_profile == "athlete"

    if aqi_value <= 50:
        return "Air is clean — great day for outdoor activity, including a jog."
    if aqi_value <= 100:
        if sensitive:
            return "Air quality is acceptable, but stay alert for any symptoms during outdoor exertion."
        return "Air quality is satisfactory for most outdoor activity."
    if aqi_value <= 200:
        if sensitive:
            return "Moderate pollution — consider shorter outdoor exposure and keep rescue medication handy."
        if athlete:
            return "Moderate pollution — an easier route or indoor workout may be worth considering today."
        return "Moderate pollution — fine for most people, but unusually sensitive individuals may notice effects."
    if aqi_value <= 300:
        if sensitive or athlete:
            return "Poor air quality — outdoor exertion is not advised; prefer an indoor workout or a mask outdoors."
        return "Poor air quality — limit prolonged outdoor exertion."
    if aqi_value <= 400:
        return "Very poor air quality — avoid outdoor exercise; general population should limit outdoor exposure."
    return "Severe air quality — stay indoors where possible; this is a health risk for everyone."
