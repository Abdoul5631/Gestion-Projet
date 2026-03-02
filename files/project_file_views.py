from django.http import FileResponse, Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from projects.models import Project

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from core.team_permissions import IsAdminOrTeamScoped
from .models import ProjectFile
from .permissions import IsProjectMemberOrAdmin, IsUploaderOrAdminDelete
from .project_file_serializers import ProjectFileUploadSerializer


@extend_schema_view(
    list=extend_schema(
        description="Lister les fichiers accessibles pour les membres d'équipe et les admins.",
        responses={200: ProjectFileUploadSerializer(many=True), 403: OpenApiResponse(description="Forbidden")},
    ),
    retrieve=extend_schema(
        description="Récupérer les métadonnées d'un fichier.",
        responses={200: ProjectFileUploadSerializer, 403: OpenApiResponse(description="Forbidden")},
    ),
    create=extend_schema(
        description="Uploader un fichier (multipart/form-data). Types autorisés: PDF, DOCX.",
        request=ProjectFileUploadSerializer,
        responses={
            201: ProjectFileUploadSerializer,
            400: OpenApiResponse(description="Bad Request - fichier invalide"),
            403: OpenApiResponse(description="Forbidden"),
        },
        examples=[
            OpenApiExample(
                "Multipart upload example",
                value={"project": 1, "file": "(binary)"},
                request_only=True,
            )
        ],
    ),
    destroy=extend_schema(
        description="Supprimer un fichier. Autorisé uniquement pour uploader ou admin.",
        responses={204: OpenApiResponse(description="Deleted"), 403: OpenApiResponse(description="Forbidden")},
    ),
)
class ProjectFileUploadViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileUploadSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped, IsProjectMemberOrAdmin, IsUploaderOrAdminDelete]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["project", "uploaded_by"]
    search_fields = ["file"]
    ordering_fields = ["upload_date"]
    queryset = ProjectFile.objects.select_related("project", "project__team", "uploaded_by").all().order_by("-upload_date")

    def get_queryset(self):
        user = self.request.user
        if str(getattr(user, "role", "")).lower() == "admin":
            return self.queryset
        if getattr(self, "action", None) == "list":
            return self.queryset.filter(project__team__members=user).distinct()
        return self.queryset

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs.get("project_pk") or self.kwargs.get("project_id")
        if not project_id:
            project_id = request.data.get("project")
        project = get_object_or_404(Project, pk=project_id)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project, uploaded_by=request.user)

        return Response(serializer.data, status=201)
    
    def perform_destroy(self, instance):
        # Delete physical file first, then DB row.
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if str(getattr(request.user, "role", "")).lower() != "admin" and obj.uploaded_by_id != request.user.id:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @extend_schema(
        description="Téléchargement sécurisé du fichier. Accessible aux membres d'équipe et admins.",
        responses={
            200: OpenApiResponse(response=OpenApiTypes.BINARY, description="File stream"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Not Found"),
        },
    )
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        obj = self.get_object()
        user = request.user

        # DEBUG LOG: Afficher les membres de l'équipe et l'utilisateur
        team_members = list(obj.project.team.members.values_list("id", "username"))
        print(f"[DOWNLOAD DEBUG] user.id={user.id}, user.username={getattr(user, 'username', None)}, team_members={team_members}")

        if str(getattr(user, "role", "")).lower() != "admin" and not obj.project.team.members.filter(id=user.id).exists():
            print(f"[DOWNLOAD DEBUG] Refusé: user.id={user.id} n'est pas membre de l'équipe du projet {obj.project.id}")
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if not obj.file:
            raise Http404("Fichier introuvable.")

        return FileResponse(obj.file.open("rb"), as_attachment=True, filename=obj.file.name.split("/")[-1])
