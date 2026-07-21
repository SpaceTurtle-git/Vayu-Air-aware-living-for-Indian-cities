from django.contrib.auth.models import User
from django.db import models


class SavedRoute(models.Model):
    """A start->destination pair a user wants to keep track of (e.g. their
    daily commute or regular jogging route) — included in the daily email."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_routes")
    name = models.CharField(max_length=80)  # "Commute to office", "Morning jog"

    start_label = models.CharField(max_length=120)
    start_lat = models.FloatField()
    start_lng = models.FloatField()

    end_label = models.CharField(max_length=120)
    end_lat = models.FloatField()
    end_lng = models.FloatField()

    TRAVEL_MODES = [("walking", "Walking / Jogging"), ("bicycling", "Cycling"), ("driving", "Driving")]
    travel_mode = models.CharField(max_length=12, choices=TRAVEL_MODES, default="walking")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
