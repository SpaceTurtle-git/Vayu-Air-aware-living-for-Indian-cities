from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city_name", "health_profile", "email_enabled", "email_hour", "email_minute")
