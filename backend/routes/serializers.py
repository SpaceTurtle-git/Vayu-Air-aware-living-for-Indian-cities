from rest_framework import serializers
from .models import SavedRoute


class SavedRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRoute
        fields = [
            "id", "name", "start_label", "start_lat", "start_lng",
            "end_label", "end_lat", "end_lng", "travel_mode", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
