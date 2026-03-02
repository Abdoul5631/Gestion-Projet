from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    LogoutAPIView,
    PasswordResetAPIView,
    PasswordResetConfirmAPIView,
    RegisterAPIView,
)
from .views_profile_settings import ProfileView, ChangePasswordView, UserSettingsView
from .views_admin_stats import UsersCountView, ProjectsCountView

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("password-reset/", PasswordResetAPIView.as_view(), name="password_reset"),
    path("password-reset-confirm/", PasswordResetConfirmAPIView.as_view(), name="password_reset_confirm"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("settings/", UserSettingsView.as_view(), name="user_settings"),
    path("admin/users-count/", UsersCountView.as_view(), name="admin_users_count"),
    path("admin/projects-count/", ProjectsCountView.as_view(), name="admin_projects_count"),
]
