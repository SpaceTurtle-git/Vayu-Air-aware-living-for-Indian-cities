from django.contrib.auth.models import User
from django.db import models


class Location(models.Model):
    """A saved place for a user, e.g. 'Home' in Andheri, Mumbai or 'Office' in CP, Delhi."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="locations")
    label = models.CharField(max_length=60)  # "Home", "Office", "Mom's place"
    city = models.CharField(max_length=120)
    latitude = models.FloatField()
    longitude = models.FloatField()
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "-created_at"]

    def __str__(self):
        return f"{self.label} ({self.city})"


class AQIReading(models.Model):
    """Cache of fetched AQI/pollution readings per (lat,lng) over time.
    Populated whenever a user's dashboard fetches fresh data. This is the
    time-series history that the prediction model (predictions app) trains on,
    since free AQI APIs only expose a few days of history."""
    latitude = models.FloatField()
    longitude = models.FloatField()
    timestamp = models.DateTimeField(db_index=True)
    aqi_in = models.FloatField(help_text="AQI on Indian CPCB 0-500 scale")
    pm25 = models.FloatField(null=True, blank=True)
    pm10 = models.FloatField(null=True, blank=True)
    no2 = models.FloatField(null=True, blank=True)
    o3 = models.FloatField(null=True, blank=True)
    is_forecast = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["latitude", "longitude", "timestamp"])]
        ordering = ["timestamp"]
