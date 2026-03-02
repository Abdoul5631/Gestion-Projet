from rest_framework.permissions import BasePermission


class IsProjectTeamMemberForMessage(BasePermission):
    """
    Allow messaging only for project team members (or admin).
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "ADMIN":
            return True
        return obj.project.team.members.filter(id=user.id).exists()
