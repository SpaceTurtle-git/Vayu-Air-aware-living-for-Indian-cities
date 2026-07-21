from django.urls import path
from .views import AQIForecastView

urlpatterns = [
    path("aqi/", AQIForecastView.as_view(), name="aqi-forecast"),
]
