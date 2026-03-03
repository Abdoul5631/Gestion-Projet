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
        # Build a new base queryset on every call.  The previous implementation
        # returned `self.queryset` directly, which is a class attribute.  The
        # problem with reusing that QuerySet instance is that Django caches its
        # results once evaluated.  In long‑running processes (the development
        # server, tests using the same connection, etc.) the cache may hold
        # stale data after objects are created/deleted.  This is what caused
        # the confusing behaviour in the temporary script: the delete actually
        # removed the row from the database, but a previously evaluated
        # queryset instance still returned the old entry.
        #
        # By rebuilding the queryset each time we avoid accidental caching and
        # ensure list/lookup operations always reflect the current database
        # state.
        user = self.request.user
        base_qs = Team.objects.select_related("manager").prefetch_related("members").order_by("id")

        if _role(user) == "admin":
            return base_qs
        if getattr(self, "action", None) == "list":
            return base_qs.filter(members=user)
        return base_qs

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

        # always add the creator to the membership list so that
        # the user who built the team can immediately see it when
        # querying for their own teams.  previously only managers
        # were added automatically which meant an admin-created
        # team with no members/manager would be invisible to the
        # creator once the default filtering (members=user) was
        # applied by non‑admin endpoints.  the admin still sees
        # everything from `get_queryset`, but regular managers may
        # forget to assign themselves when they create a team.
        creator_id = getattr(self.request.user, "id", None)
        if creator_id is not None:
            team.members.add(creator_id)

        # make sure the declared manager is always in the member
        # set as well. this was already done before but keep it
        # after the creator logic so the order is more predictable.
        if team.manager_id:
            team.members.add(team.manager_id)

        # keep the existing manager-specific behaviour; it can run
        # for managers and will also redundantly re-add the creator
        # but that's harmless because the relation is a set.
        if _role(self.request.user) == "manager":
            team.members.add(self.request.user.id)
            if team.manager_id is None:
                team.manager = self.request.user
                team.save(update_fields=["manager"])

    def perform_update(self, serializer):
        team = serializer.save()
        if team.manager_id:
            team.members.add(team.manager_id)
