from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import IsAdminOrTeamScoped
from .models import Team
from .serializers import TeamSerializer


def _role(user):
    return str(getattr(user, "role", "")).lower()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    queryset = Team.objects.select_related("manager").prefetch_related("members").all().order_by("id")
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped]

    def get_queryset(self):
        user = self.request.user
        if _role(user) == "admin":
            return self.queryset
        if getattr(self, "action", None) == "list":
            return self.queryset.filter(members=user)
        return self.queryset

    def create(self, request, *args, **kwargs):
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if _role(request.user) not in {"admin", "manager"}:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if _role(request.user) != "admin":
            return Response({"detail": "Seul l'admin peut supprimer."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        team = serializer.save()
        if team.manager_id:
            team.members.add(team.manager_id)
        if _role(self.request.user) == "manager":
            team.members.add(self.request.user.id)
            if team.manager_id is None:
                team.manager = self.request.user
                team.save(update_fields=["manager"])

    def perform_update(self, serializer):
        team = serializer.save()
        if team.manager_id:
            team.members.add(team.manager_id)
