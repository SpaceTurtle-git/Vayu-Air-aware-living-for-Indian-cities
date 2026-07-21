from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    """Extra per-user settings: primary location + daily email preferences."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Primary location (set during onboarding). Users can add more via the
    # Location model in the `locations` app, but this is the one the
    # dashboard and the daily email default to.
    city_name = models.CharField(max_length=120, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # Daily email report
    email_enabled = models.BooleanField(default=True)
    email_hour = models.PositiveSmallIntegerField(default=7)   # 0-23, Asia/Kolkata
    email_minute = models.PositiveSmallIntegerField(default=0)  # 0-59
    last_emailed_on = models.DateField(null=True, blank=True)

    # Health context — lets the dashboard/email flag riskier AQI thresholds
    HEALTH_CHOICES = [
        ("general", "General / no condition"),
        ("asthma", "Asthma / respiratory condition"),
        ("heart", "Cardiovascular condition"),
        ("athlete", "Fitness enthusiast / runner"),
        ("child_elderly", "Child or elderly household member"),
    ]
    health_profile = models.CharField(max_length=20, choices=HEALTH_CHOICES, default="general")

    def __str__(self):
        return f"Profile({self.user.username})"
