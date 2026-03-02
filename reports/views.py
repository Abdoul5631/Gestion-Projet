from rest_framework import status, viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import _role
from django.shortcuts import get_object_or_404

from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    queryset = Report.objects.select_related("author").all().order_by("-created_at")

    def get_queryset(self):
        import logging
        logger = logging.getLogger("django")
        logger.warning("[DEBUG] get_queryset appelé pour lister les rapports.")
        user = self.request.user
        role = _role(user)
        if role == "admin":
            return self.queryset
        if role == "manager":
            # rapports liés à un projet d'une équipe du manager
            return self.queryset.filter(project__team__members=user).distinct()
        if role == "member":
            from projects.models import Project
            my_projects = Project.objects.filter(team__members=user)
            my_project_ids = list(my_projects.values_list("id", flat=True))
            manager_ids = list(my_projects.exclude(manager=None).values_list("manager_id", flat=True))
            import logging
            logger = logging.getLogger("django")
            logger.warning(f"DEBUG - Projets du membre: {my_project_ids}, Managers: {manager_ids}")
            own_reports = self.queryset.filter(author=user)
            global_reports = self.queryset.filter(
                project_id__in=my_project_ids,
                author_id__in=manager_ids
            )
            logger.warning(f"DEBUG - Rapports globaux trouvés: {[r.id for r in global_reports]}")
            return own_reports | global_reports
        # fallback : aucun rapport
        return self.queryset.none()

    def perform_create(self, serializer):
        # ensure project association is valid
        project = serializer.validated_data.get("project")
        user = self.request.user
        role = _role(user)
        if project is None:
            raise serializers.ValidationError({"project": "This field is required."})
        # member must belong to project's team
        if role == "member":
            if not project.team.members.filter(id=user.id).exists():
                raise serializers.ValidationError(
                    "You can only create reports for projects in your team."
                )
        # managers peuvent créer des rapports globaux liés à un projet
        if role == "manager":
            # Vérifie que le manager appartient à l'équipe du projet
            if not project.team.members.filter(id=user.id).exists():
                raise serializers.ValidationError(
                    "Vous ne pouvez créer un rapport que pour un projet de votre équipe."
                )
            # Le manager peut créer le rapport
            serializer.save(author=user)
            return
        # admin may create freely (if needed)
        serializer.save(author=user)

    def update(self, request, *args, **kwargs):
        report = self.get_object()
        user = request.user
        role = _role(user)
        # debug info removed after testing
        if role == "admin":
            return super().update(request, *args, **kwargs)
        if role == "manager":
            teams = list(report.author.teams.values_list('id', flat=True))
            # check whether there exists a team that contains both the report author and this manager
            from teams.models import Team
            # need two filter calls to avoid python keyword repetition
            membership = Team.objects.filter(members=report.author).filter(members=user).exists()
            if not membership:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            allowed = {"status", "manager_comment"}
            keys = set(request.data.keys())
            if not keys.issubset(allowed):
                return Response({"detail": "Only status/manager_comment can be modified by manager."}, status=status.HTTP_403_FORBIDDEN)
            return super().update(request, *args, **kwargs)
        # member editing own report while pending
        if report.author_id == user.id and report.status == Report.STATUS_PENDING:
            allowed2 = {"title", "content"}
            if not set(request.data.keys()).issubset(allowed2):
                return Response({"detail": "Cannot modify this field."}, status=status.HTTP_403_FORBIDDEN)
            return super().update(request, *args, **kwargs)
        return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, *args, **kwargs):
        # ensure DRF knows this is a partial update
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)
