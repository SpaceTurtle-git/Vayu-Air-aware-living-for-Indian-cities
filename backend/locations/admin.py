from django.contrib import admin
from .models import Location, AQIReading

admin.site.register(Location)
admin.site.register(AQIReading)
