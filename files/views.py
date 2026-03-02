from rest_framework import parsers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import IsAdminOrTeamScoped
from .models import ProjectFile
from .serializers import ProjectFileSerializer


def _role(user):
    return str(getattr(user, "role", "")).lower()


class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    queryset = ProjectFile.objects.select_related("project", "project__team", "uploaded_by").all().order_by("-upload_date")

    def get_queryset(self):
        user = self.request.user
        if _role(user) == "admin":
            return self.queryset
        if self.action == "list":
            return self.queryset.filter(project__team__members=user).distinct()
        return self.queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.validated_data["project"]
        if _role(request.user) != "admin" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if _role(request.user) == "admin":
            return super().destroy(request, *args, **kwargs)
        if _role(request.user) == "manager" and obj.project.team.members.filter(id=request.user.id).exists():
            return super().destroy(request, *args, **kwargs)
        if obj.uploaded_by_id == request.user.id:
            return super().destroy(request, *args, **kwargs)
        return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
