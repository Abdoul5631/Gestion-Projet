from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from .models import ProjectFile
from .project_file_serializers import ProjectFileUploadSerializer


class ProjectFileListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ProjectFile.objects.select_related("project", "project__team", "uploaded_by").all().order_by("-upload_date")
        if user.role == "ADMIN":
            return qs
        return qs.filter(project__team__members=user).distinct()

    def get(self, request):
        serializer = ProjectFileUploadSerializer(self.get_queryset(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProjectFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.validated_data.get("project")
        if project is None:
            project_id = request.data.get("project")
            if not project_id:
                return Response({"project": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            try:
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return Response({"project": ["Invalid project id."]}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.role != "ADMIN" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(uploaded_by=request.user, project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
