from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Task
from .serializers import TaskSerializer


@extend_schema_view(
    list=extend_schema(description="Lister les tâches accessibles (admin: tout, sinon équipe)."),
    retrieve=extend_schema(description="Détail d'une tâche."),
    create=extend_schema(description="Créer une tâche (ADMIN/MANAGER)."),
    update=extend_schema(description="Mettre à jour une tâche (ADMIN/MANAGER d'équipe)."),
    partial_update=extend_schema(description="Mise à jour partielle. MEMBER: modifier sa propre tâche."),
    destroy=extend_schema(description="Supprimer une tâche (ADMIN/MANAGER d'équipe)."),
)
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    filterset_fields = ["status", "due_date"]
    ordering_fields = ["due_date", "status"]
    queryset = Task.objects.select_related(
        "project", "assigned_to", "project__team"
    ).all().order_by("id")

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return self.queryset
        if getattr(self, "action", None) == "list":
            return self.queryset.filter(project__team__members=user).distinct()
        return self.queryset

    def _is_team_manager(self, user, task):
        return (
            user.role == "MANAGER"
            and task.project.team.members.filter(id=user.id).exists()
        )

    def create(self, request, *args, **kwargs):
        if request.user.role not in {"ADMIN", "MANAGER"}:
            return Response(
                {"detail": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if request.user.role in {"ADMIN", "MANAGER"}:
            return super().update(request, *args, **kwargs)
        return Response(
            {"detail": "Accès refusé."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()

        # ADMIN ou MANAGER → peut modifier
        if request.user.role in {"ADMIN", "MANAGER"}:
            return super().partial_update(request, *args, **kwargs)

        # MEMBER → peut modifier sa propre tâche
        if task.assigned_to_id == request.user.id:
            return super().partial_update(request, *args, **kwargs)

        return Response(
            {"detail": "Accès refusé."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if request.user.role in {"ADMIN", "MANAGER"}:
            return super().destroy(request, *args, **kwargs)
        return Response(
            {"detail": "Accès refusé."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @extend_schema(description="Transitionner la tâche vers IN_PROGRESS.")
    @action(detail=True, methods=["post"])
    def start_task(self, request, pk=None):
        task = self.get_object()
        if request.user.role not in {"ADMIN", "MANAGER"} and task.assigned_to_id != request.user.id:
            return Response(
                {"detail": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        task.status = Task.STATUS_IN_PROGRESS
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)

    @extend_schema(description="Transitionner la tâche vers DONE.")
    @action(detail=True, methods=["post"])
    def complete_task(self, request, pk=None):
        task = self.get_object()
        if request.user.role not in {"ADMIN", "MANAGER"} and task.assigned_to_id != request.user.id:
            return Response(
                {"detail": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        task.status = Task.STATUS_DONE
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)

# ---------- additional tests ----------
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from teams.models import Team
from projects.models import Project

User = get_user_model()


def _login(client, username, password):
    res = client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")


class TaskMembershipTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="mgr", email="mgr@example.com", password="pass1234", role="MANAGER"
        )
        self.member = User.objects.create_user(
            username="m1", email="m1@example.com", password="pass1234", role="MEMBER"
        )
        self.team = Team.objects.create(name="TeamX")
        self.team.members.add(self.manager)

    def test_assign_task_adds_member_to_team(self):
        _login(self.client, "mgr", "pass1234")
        project = Project.objects.create(
            name="P1",
            description="",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status=Project.STATUS_ACTIVE,
            team=self.team,
        )
        self.assertFalse(self.team.members.filter(id=self.member.id).exists())
        payload = {
            "title": "T1",
            "project": project.id,
            "assigned_to": self.member.id,
        }
        response = self.client.post("/api/tasks/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.team.members.filter(id=self.member.id).exists())

    def test_member_sees_assigned_task(self):
        self.team.members.add(self.member)
        project = Project.objects.create(
            name="P2",
            description="",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status=Project.STATUS_ACTIVE,
            team=self.team,
        )
        _login(self.client, "mgr", "pass1234")
        task = self.client.post("/api/tasks/", {"title": "T2", "project": project.id, "assigned_to": self.member.id}, format="json").data
        _login(self.client, "m1", "pass1234")
        response = self.client.get("/api/tasks/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [t["id"] for t in response.data.get("results", response.data)]
        self.assertIn(task["id"], ids)

    def test_manager_can_update_task(self):
        # manager owns team, create project and task
        project = Project.objects.create(
            name="P3",
            description="",
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=Project.STATUS_ACTIVE,
            team=self.team,
        )
        # member must also belong to team for assignment
        self.team.members.add(self.member)
        task_obj = Task.objects.create(
            title="Old",
            project=project,
            assigned_to=self.member,
            status=Task.STATUS_TODO,
        )
        _login(self.client, "mgr", "pass1234")
        res = self.client.patch(f"/api/tasks/{task_obj.id}/", {"title": "New"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task_obj.refresh_from_db()
        self.assertEqual(task_obj.title, "New")

    @extend_schema(description="Transitionner la tâche vers CANCELLED.")
    @action(detail=True, methods=["post"])
    def cancel_task(self, request, pk=None):
        task = self.get_object()
        if request.user.role not in {"ADMIN", "MANAGER"} and task.assigned_to_id != request.user.id:
            return Response(
                {"detail": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN,
            )
        task.status = Task.STATUS_CANCELLED
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)