from django.contrib import admin
from django.urls import path, include, re_path

from .frontend_views import serve_frontend

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/weather/", include("weather.urls")),
    path("api/predictions/", include("predictions.urls")),
    path("api/routes/", include("routes.urls")),

    # Catch-all: everything that isn't /admin/ or /api/... is a client-side
    # React Router route (or the SPA root "/"), so hand back the built
    # index.html and let the frontend router take over. This MUST stay last.
    re_path(r"^(?!admin/|api/).*$", serve_frontend, name="frontend"),
]
