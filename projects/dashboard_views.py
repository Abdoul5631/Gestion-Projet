from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.models import Task
from teams.models import Team
from .models import Project

User = get_user_model()


def _role(user):
    return str(getattr(user, "role", "")).lower()


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _role(request.user) == "admin":
            projects_qs = Project.objects.all()
            tasks_qs = Task.objects.all()
            users_qs = User.objects.all()
            teams_qs = Team.objects.all()
        else:
            projects_qs = Project.objects.filter(team__members=request.user).distinct()
            tasks_qs = Task.objects.filter(project__team__members=request.user).distinct()
            users_qs = User.objects.filter(teams__projects__in=projects_qs).distinct()
            teams_qs = Team.objects.filter(projects__in=projects_qs).distinct()

        statuses = [choice[0] for choice in Project.STATUS_CHOICES]
        raw_counts = projects_qs.values("status").annotate(total=Count("id"))
        mapped_counts = {item["status"]: item["total"] for item in raw_counts}

        total_tasks = tasks_qs.count()
        overdue_tasks = (
            tasks_qs.exclude(status="DONE")
            .exclude(due_date__isnull=True)
            .filter(due_date__lt=timezone.now().date())
            .count()
        )

        return Response(
            {
                "total_projects": projects_qs.count(),
                "total_teams": teams_qs.count(),
                "total_users": users_qs.count(),
                "total_tasks": total_tasks,
                "overdue_tasks": overdue_tasks,
                "projects_by_status": {status: mapped_counts.get(status, 0) for status in statuses},
            }
        )
