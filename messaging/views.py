from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.team_permissions import IsAdminOrTeamScoped, IsCreatorOrAdminForUnsafe
from projects.models import Project
from .models import Message
from .permissions import IsProjectTeamMemberForMessage
from .serializers import MessageSerializer


def _role(user):
    return str(getattr(user, "role", "")).lower()


from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeamScoped, IsProjectTeamMemberForMessage, IsCreatorOrAdminForUnsafe]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["project", "sender"]
    search_fields = ["content"]
    ordering_fields = ["timestamp"]
    queryset = Message.objects.select_related("sender", "project", "project__team").all().order_by("-timestamp")

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

        project = serializer.validated_data.get("project")
        if project is None:
            project_id = request.data.get("project")
            if not project_id:
                return Response({"project": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            try:
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return Response({"project": ["Invalid project id."]}, status=status.HTTP_400_BAD_REQUEST)

        if _role(request.user) != "admin" and not project.team.members.filter(id=request.user.id).exists():
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(sender=request.user, project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if _role(request.user) != "admin" and instance.sender_id != request.user.id:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if _role(request.user) != "admin" and instance.sender_id != request.user.id:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
