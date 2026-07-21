from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from weather.services import get_current_weather, get_air_pollution_current
from weather.aqi_utils import health_advisory
from predictions.ml_model import forecast_daily_aqi
from routes.services import get_route_options


def build_and_send_daily_email(profile):
    user = profile.user
    if not user.email:
        return False, "no email on file"
    if profile.latitude is None or profile.longitude is None:
        return False, "no primary location set"

    lat, lng = profile.latitude, profile.longitude
    weather = get_current_weather(lat, lng)
    aqi = get_air_pollution_current(lat, lng)
    forecast = forecast_daily_aqi(lat, lng, days=4)

    saved_routes_ctx = []
    for r in user.saved_routes.all()[:3]:
        try:
            result = get_route_options(r.start_lat, r.start_lng, r.end_lat, r.end_lng, mode=r.travel_mode)
            best = result["routes"][0] if result["routes"] else {}
        except Exception:
            best = {}
        saved_routes_ctx.append({
            "name": r.name, "start_label": r.start_label, "end_label": r.end_label,
            "summary": best.get("summary"), "avg_aqi": best.get("avg_aqi"),
            "category": best.get("category"),
        })

    context = {
        "first_name": user.first_name or user.username,
        "city_name": profile.city_name or weather.get("city_name", ""),
        "today_date": weather["observed_at"][:10],
        "temp_c": round(weather["temp_c"]),
        "weather_description": weather["description"].title(),
        "humidity_pct": weather["humidity_pct"],
        "aqi_value": aqi.get("aqi"),
        "aqi_category": aqi.get("category"),
        "aqi_color": aqi.get("color", "#4CBB6C"),
        "dominant_pollutant": aqi.get("dominant_pollutant"),
        "health_advisory": health_advisory(aqi.get("aqi"), profile.health_profile),
        "forecast": forecast,
        "saved_routes": saved_routes_ctx,
    }

    html_body = render_to_string("emails/daily_report.html", context)
    send_mail(
        subject=f"Your Vayu air report for {context['city_name']} — AQI {context['aqi_value']}",
        message=strip_tags(html_body),
        html_message=html_body,
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[user.email],
        fail_silently=False,
    )
    return True, "sent"
