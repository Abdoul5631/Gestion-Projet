from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsProjectMemberOrAdmin(BasePermission):
    """
    Read/download: members of the project team or admin.
    Create: same rule as read.
    Delete: handled by IsUploaderOrAdminDelete in object-level check.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == "ADMIN":
            return True
        return obj.project.team.members.filter(id=user.id).exists()


class IsUploaderOrAdminDelete(BasePermission):
    """Allow delete only to uploader or admin."""

    def has_object_permission(self, request, view, obj):
        if request.method != "DELETE":
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role == "ADMIN" or obj.uploaded_by_id == user.id
