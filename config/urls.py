
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.calendar_api import CalendarAPIView


def home(_request):
    return JsonResponse({"status": "ok", "service": "Gestion-Projet API"})


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # JWT public endpoints required by frontend
    path("api/token/", TokenObtainPairView.as_view(), name="api_token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="api_token_refresh"),

    # Auth, user and reset password
    path("api/auth/", include("users.urls")),
    path("api/users/", include("users.user_urls")),

    path("api/teams/", include("teams.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/messages/", include("messaging.urls")),
    path("api/", include("files.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/dashboard/", include("projects.dashboard_urls")),

    # Calendar endpoint
    path("api/calendar/", CalendarAPIView.as_view(), name="calendar-api"),
]
