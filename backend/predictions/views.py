from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .ml_model import forecast_daily_aqi


class AQIForecastView(APIView):
    """
    GET /api/predictions/aqi/?lat=..&lng=..&days=7
    Returns a day-by-day AQI/pollution forecast using the local ML model.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
        except (KeyError, ValueError):
            return Response({"detail": "lat and lng query params are required"}, status=400)
        days = int(request.query_params.get("days", 7))

        forecast = forecast_daily_aqi(lat, lng, days=days)
        if not forecast:
            return Response({
                "forecast": [],
                "note": "Not enough data yet for this location — check back after your "
                        "dashboard has fetched a few readings, or once daily emails start "
                        "logging data.",
            })
        return Response({"forecast": forecast})
