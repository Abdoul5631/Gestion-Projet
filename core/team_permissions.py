from rest_framework.permissions import BasePermission, SAFE_METHODS


def _role(user):
    return str(getattr(user, "role", "")).lower()


class IsAdminOrTeamScoped(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        print("[DEBUG PERM] has_permission called, user.id=", getattr(user, "id", None), "is_authenticated=", getattr(user, "is_authenticated", None))
        import sys; sys.stdout.flush()
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = _role(user)
        if role == "admin":
            return True

        # Autoriser le manager de l'équipe
        if hasattr(obj, "manager_id") and obj.manager_id == user.id:
            return True

        # Autoriser l'utilisateur assigné à la tâche (comparaison stricte en int)
        if hasattr(obj, "assigned_to_id") and obj.assigned_to_id is not None:
            try:
                if int(obj.assigned_to_id) == int(user.id):
                    return True
            except Exception:
                pass

        if hasattr(obj, "members"):
            return obj.members.filter(id=user.id).exists()
        if hasattr(obj, "team"):
            return obj.team.members.filter(id=user.id).exists()
        project = getattr(obj, "project", None)
        if project is not None:
            return project.team.members.filter(id=user.id).exists()
        return False


class IsCreatorOrAdminForUnsafe(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == "admin":
            return True
        for field in ("uploaded_by_id", "sender_id", "created_by_id", "owner_id"):
            if getattr(obj, field, None) == user.id:
                return True
        return False
