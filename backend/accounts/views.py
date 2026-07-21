from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User

from .models import Profile
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer


class RegisterView(generics.CreateAPIView):
    """POST username/email/password -> creates User + blank Profile."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """POST username/password -> {access, refresh} JWT pair."""
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """GET current user + profile. PATCH to update profile fields
    (location, health condition, email preferences)."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
