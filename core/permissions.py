from rest_framework.permissions import BasePermission


def _role(user):
    return str(getattr(user, "role", "")).lower()


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _role(request.user) == "admin")


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and _role(request.user) == "manager")


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and _role(request.user) in {"admin", "manager"}
        )


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == "admin":
            return True
        owner_id = getattr(obj, "owner_id", None) or getattr(obj, "user_id", None) or getattr(obj, "created_by_id", None)
        return owner_id == user.id
