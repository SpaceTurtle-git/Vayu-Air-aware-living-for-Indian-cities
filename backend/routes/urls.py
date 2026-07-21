from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import SavedRouteViewSet, RouteCompareView

router = DefaultRouter()
router.register("saved", SavedRouteViewSet, basename="saved-route")

urlpatterns = [
    path("compare/", RouteCompareView.as_view(), name="route-compare"),
] + router.urls
