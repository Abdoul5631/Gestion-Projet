from django.db.models import Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import IsAdminOrTeamScoped
from files.models import ProjectFile
from files.project_file_serializers import ProjectFileUploadSerializer
from messaging.models import Message
from messaging.serializers import MessageSerializer
from tasks.models import Task
from .models import Project
from .permissions import IsProjectTeamMemberOrAdminForWrite
from .serializers import ProjectSerializer


def _role(user):
    return str(getattr(user, "role", "")).lower()


@extend_schema_view(
    list=extend_schema(description="Lister les projets visibles selon role/equipe."),
)
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped, IsProjectTeamMemberOrAdminForWrite]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["status", "start_date", "end_date"]
    ordering_fields = ["start_date", "end_date", "status"]
    queryset = Project.objects.select_related("team", "manager", "team__manager").prefetch_related("team__members").all().order_by("id")

    def get_queryset(self):
        user = self.request.user
        if _role(user) == "admin":
            return self.queryset
        if self.action == "list":
            return self.queryset.filter(team__members=user).distinct()
        return self.queryset

    def _can_manage(self, user, team):
        if _role(user) == "admin":
            return True
        return team.members.filter(id=user.id).exists()

    def create(self, request, *args, **kwargs):
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        role = _role(self.request.user)
        project = serializer.save()
        if _role(self.request.user) == "manager" and not project.team.members.filter(id=self.request.user.id).exists():
            project.delete()
            raise serializers.ValidationError("Manager can only create projects in their own team.")
        if not project.manager_id:
            if role == "manager":
                project.manager = self.request.user
            elif project.team.manager_id:
                project.manager = project.team.manager
            project.save(update_fields=["manager"])

    def perform_update(self, serializer):
        project = serializer.save()
        # make sure manager is always part of the team after changes
        if project.manager_id and not project.team.members.filter(id=project.manager_id).exists():
            project.team.members.add(project.manager_id)

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if not self._can_manage(request.user, project.team):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        project = self.get_object()
        if not self._can_manage(request.user, project.team):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if _role(request.user) != "admin":
            return Response({"detail": "Only admin can delete projects."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def report(self, request, pk=None):
        project = self.get_object()
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        if _role(request.user) == "manager" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        tasks_qs = Task.objects.filter(project=project).select_related("assigned_to")
        total_tasks = tasks_qs.count()
        completed_tasks = tasks_qs.filter(status=Task.STATUS_DONE).count()
        pending_tasks = tasks_qs.exclude(status=Task.STATUS_DONE).count()
        overdue_tasks = tasks_qs.exclude(status=Task.STATUS_DONE).filter(due_date__lt=timezone.now().date()).count()
        tasks_by_member = {
            row["assigned_to__username"]: row["total"]
            for row in tasks_qs.filter(status=Task.STATUS_DONE, assigned_to__isnull=False)
            .values("assigned_to__username")
            .annotate(total=Count("id"))
        }
        task_status_summary = list(tasks_qs.values("status").annotate(total=Count("id")).order_by("status"))
        progress_percentage = 0 if total_tasks == 0 else int((completed_tasks / total_tasks) * 100)
        return Response(
            {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks,
                "overdue_tasks": overdue_tasks,
                "progress_percentage": progress_percentage,
                "tasks_by_member": tasks_by_member,
                "task_status_summary": task_status_summary,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        project = self.get_object()
        if _role(request.user) != "admin" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        if request.method == "GET":
            qs = Message.objects.filter(project=project).select_related("sender").order_by("-timestamp")
            return Response(MessageSerializer(qs, many=True).data)
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="files", parser_classes=[MultiPartParser, FormParser])
    def files(self, request, pk=None):
        project = self.get_object()
        if _role(request.user) != "admin" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        if request.method == "GET":
            qs = ProjectFile.objects.filter(project=project).select_related("uploaded_by").order_by("-upload_date")
            return Response(ProjectFileUploadSerializer(qs, many=True).data)
        serializer = ProjectFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
