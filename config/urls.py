from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.calendar_api import CalendarAPIView


urlpatterns = [
    # ==============================
    # ADMIN
    # ==============================
    path("admin/", admin.site.urls),

    # ==============================
    # API DOCUMENTATION
    # ==============================
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/docs/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),

    # ==============================
    # JWT AUTH
    # ==============================
    path("api/token/", TokenObtainPairView.as_view(), name="api_token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="api_token_refresh"),

    # ==============================
    # API ROUTES
    # ==============================
    path("api/auth/", include("users.urls")),
    path("api/users/", include("users.user_urls")),
    path("api/teams/", include("teams.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/messages/", include("messaging.urls")),
    path("api/", include("files.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/dashboard/", include("projects.dashboard_urls")),
    path("api/calendar/", CalendarAPIView.as_view(), name="calendar-api"),
]

# ==============================
# REACT FRONTEND (IMPORTANT)
# ==============================

urlpatterns += [
    re_path(r"^.*$", TemplateView.as_view(template_name="index.html")),
]