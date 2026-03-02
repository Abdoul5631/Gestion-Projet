from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import IsAdminOrTeamScoped
from .models import Task
from .serializers import TaskSerializer


def _role(user):
    return str(getattr(user, "role", "")).lower()


@extend_schema_view(
    list=extend_schema(description="Liste des taches accessibles."),
    retrieve=extend_schema(description="Detail d'une tache."),
)
class TaskViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        # Pour les méthodes non-safe, forcer la vérification objet
        if self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [IsAuthenticated, IsAdminOrTeamScoped]
        return super().get_permissions()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    filterset_fields = ["status", "due_date"]
    ordering_fields = ["due_date", "status"]
    queryset = Task.objects.select_related("project", "assigned_to", "project__team").all().order_by("id")

    def get_queryset(self):
        user = self.request.user
        if _role(user) == "admin":
            return self.queryset
        if getattr(self, "action", None) == "list":
            return self.queryset.filter(project__team__members=user).distinct()
        return self.queryset

    def _is_team_manager(self, user, task):
        return _role(user) == "manager" and task.project.team.members.filter(id=user.id).exists()

    def create(self, request, *args, **kwargs):
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        response = super().create(request, *args, **kwargs)
        # if a manager/admin assigned the task to a user, make sure that user
        # becomes a member of the project team so they can view related data.
        assigned = request.data.get("assigned_to")
        if assigned:
            try:
                task = Task.objects.get(pk=response.data.get("id"))
                proj = task.project
                user_id = int(assigned)
                if not proj.team.members.filter(id=user_id).exists():
                    proj.team.members.add(user_id)
            except Exception:
                pass
        return response

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if _role(request.user) == "admin" or self._is_team_manager(request.user, task):
            response = super().update(request, *args, **kwargs)
            # if assignment changed, ensure the new assignee is added to team
            assigned = request.data.get("assigned_to")
            if assigned:
                try:
                    proj = task.project
                    user_id = int(assigned)
                    if not proj.team.members.filter(id=user_id).exists():
                        proj.team.members.add(user_id)
                except Exception:
                    pass
            return response
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        user_id = int(getattr(user, "id", 0))
        assigned_id = int(task.assigned_to_id) if task.assigned_to_id is not None else None

        # ADMIN ou MANAGER de l'équipe
        if _role(user) == "admin" or self._is_team_manager(user, task):
            return super().partial_update(request, *args, **kwargs)

        # MEMBRE assigné à la tâche : peut modifier le statut uniquement
        if _role(user) == "member" and assigned_id == user_id:
            payload_keys = set(request.data.keys())
            if payload_keys == {"status"}:
                # Mise à jour manuelle du statut sans repasser par super().partial_update()
                status_value = request.data.get("status")
                serializer = self.get_serializer(task, data={"status": status_value}, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
            return Response({"detail": "Seul le statut peut être modifié."}, status=status.HTTP_403_FORBIDDEN)

        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if _role(request.user) == "admin" or self._is_team_manager(request.user, task):
            return super().destroy(request, *args, **kwargs)
        return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

    @extend_schema(description="Filtre calendrier des taches.")
    @action(detail=False, methods=["get"], url_path="calendar")
    def calendar(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        queryset = self.filter_queryset(self.get_queryset())
        if start_date and end_date:
            queryset = queryset.filter(due_date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(due_date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(due_date__lte=end_date)
        return Response(self.get_serializer(queryset, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def start_task(self, request, pk=None):
        task = self.get_object()
        if _role(request.user) not in {"admin", "manager"} and task.assigned_to_id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        task.status = Task.STATUS_IN_PROGRESS
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["post"])
    def complete_task(self, request, pk=None):
        task = self.get_object()
        if _role(request.user) not in {"admin", "manager"} and task.assigned_to_id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        task.status = Task.STATUS_DONE
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["post"])
    def cancel_task(self, request, pk=None):
        task = self.get_object()
        if _role(request.user) not in {"admin", "manager"} and task.assigned_to_id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        task.status = Task.STATUS_CANCELLED
        task.save(update_fields=["status"])
        return Response(self.get_serializer(task).data)
