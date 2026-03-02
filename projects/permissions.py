from rest_framework.permissions import BasePermission, SAFE_METHODS


def _role(user):
    return str(getattr(user, "role", "")).lower()


class IsProjectTeamMemberOrAdminForWrite(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == "admin":
            return True

        is_team_member = obj.team.members.filter(id=user.id).exists()
        if request.method in SAFE_METHODS:
            return is_team_member
        if view.action in {"update", "partial_update"}:
            return is_team_member
        if view.action == "destroy":
            return False
        return is_team_member
