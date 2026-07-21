from rest_framework import viewsets, permissions
from .models import Location
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ModelViewSet):
    """Full CRUD for a user's saved locations (Home / Office / etc)."""
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
