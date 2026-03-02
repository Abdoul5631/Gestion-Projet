from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.permissions import IsAdmin
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Token invalide."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Deconnexion reussie."}, status=status.HTTP_200_OK)


class PasswordResetAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"email": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(str(user.pk).encode())
            token = default_token_generator.make_token(user)
            return Response(
                {
                    "detail": "Password reset token generated.",
                    "uid": uid,
                    "token": token,
                },
                status=status.HTTP_200_OK,
            )
        return Response({"detail": "If the email exists, reset instructions were sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")
        if not uid or not token or not new_password:
            return Response({"detail": "uid, token and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"detail": "Invalid uid."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.prefetch_related("teams").all().order_by("id")
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["role", "is_active"]
    search_fields = ["username", "email"]
    ordering_fields = ["id", "username", "email", "role"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action == "list":
            # Autoriser tous les utilisateurs connectés à voir la liste
            return [IsAuthenticated()]
        if self.action in {"destroy", "activate"}:
            # Suppression et activation réservées à l'admin
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"deactivate"}:
            return [IsAuthenticated(), IsAdmin()]
        if self.action in {"update", "partial_update"}:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role != User.ROLE_ADMIN and instance.id != request.user.id:
            return Response({"detail": "Acces refuse."}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        target = self.get_object()
        payload_role = request.data.get("role")
        if payload_role is not None and request.user.role != User.ROLE_ADMIN:
            return Response({"detail": "Seul un admin peut changer les roles."}, status=status.HTTP_403_FORBIDDEN)
        if payload_role == User.ROLE_ADMIN and request.user.role != User.ROLE_ADMIN:
            return Response({"detail": "Acces refuse."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role != User.ROLE_ADMIN and target.id != request.user.id:
            return Response({"detail": "Acces refuse."}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role != User.ROLE_ADMIN:
            forbidden = {"role", "is_staff", "is_superuser", "is_active", "groups", "user_permissions"}
            if forbidden.intersection(set(request.data.keys())):
                return Response({"detail": "Champ non autorise."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        # allow patch semantics (partial=True) instead of forcing full payload
        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated, IsAdmin])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated, IsAdmin])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data, status=status.HTTP_200_OK)
