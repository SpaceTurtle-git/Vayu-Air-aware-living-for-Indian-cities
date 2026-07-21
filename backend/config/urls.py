from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/weather/", include("weather.urls")),
    path("api/predictions/", include("predictions.urls")),
    path("api/routes/", include("routes.urls")),
]
