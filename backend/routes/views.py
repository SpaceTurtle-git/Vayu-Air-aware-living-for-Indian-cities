from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, permissions

from .models import SavedRoute
from .serializers import SavedRouteSerializer
from .services import get_route_options


class SavedRouteViewSet(viewsets.ModelViewSet):
    """CRUD for a user's saved start->destination routes (shown in the
    dashboard and included in the daily email)."""
    serializer_class = SavedRouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedRoute.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RouteCompareView(APIView):
    """
    GET /api/routes/compare/?start_lat=&start_lng=&end_lat=&end_lng=&mode=walking
    Returns every alternative Google route between the two points, each
    scored by average air quality along it, cleanest-first.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        p = request.query_params
        try:
            start_lat = float(p["start_lat"]); start_lng = float(p["start_lng"])
            end_lat = float(p["end_lat"]); end_lng = float(p["end_lng"])
        except (KeyError, ValueError):
            return Response({"detail": "start_lat, start_lng, end_lat, end_lng are required"}, status=400)
        mode = p.get("mode", "walking")
        if mode not in ("walking", "bicycling", "driving"):
            mode = "walking"

        result = get_route_options(start_lat, start_lng, end_lat, end_lng, mode=mode)
        if result["error"]:
            return Response({"detail": f"Google Directions error: {result['error']}"}, status=502)
        return Response(result)
