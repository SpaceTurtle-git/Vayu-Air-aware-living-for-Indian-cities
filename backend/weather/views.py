from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from locations.models import AQIReading
from .services import (
    get_current_weather, get_air_pollution_current,
    get_air_pollution_forecast, get_waqi_station_aqi,
)
from .aqi_utils import health_advisory


class DashboardView(APIView):
    """
    GET /api/weather/dashboard/?lat=19.076&lng=72.877
    One call that the React dashboard uses to render everything:
    current weather + AQI + pollution breakdown + near-term forecast +
    a plain-language health tip based on the logged-in user's health profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
        except (KeyError, ValueError):
            return Response({"detail": "lat and lng query params are required"}, status=400)

        weather = get_current_weather(lat, lng)
        aqi = get_air_pollution_current(lat, lng)
        forecast = get_air_pollution_forecast(lat, lng)
        waqi_station = get_waqi_station_aqi(lat, lng)

        # Cache this reading so the prediction model has history to learn from.
        if aqi.get("aqi") is not None:
            AQIReading.objects.create(
                latitude=lat, longitude=lng,
                timestamp=datetime.now(timezone.utc),
                aqi_in=aqi["aqi"],
                pm25=aqi.get("components", {}).get("pm2_5"),
                pm10=aqi.get("components", {}).get("pm10"),
                no2=aqi.get("components", {}).get("no2"),
                o3=aqi.get("components", {}).get("o3"),
                is_forecast=False,
            )

        health_profile = getattr(request.user.profile, "health_profile", "general")

        return Response({
            "weather": weather,
            "aqi": aqi,
            "waqi_station": waqi_station,
            "forecast_4day_hourly": forecast,
            "health_advisory": health_advisory(aqi.get("aqi"), health_profile),
        })
