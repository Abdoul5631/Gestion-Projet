from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Team

User = get_user_model()


class TeamSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, required=False)
    manager = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Team
        fields = ["id", "name", "description", "manager", "members"]
        read_only_fields = ["id"]

    def validate_manager(self, value):
        if value and str(getattr(value, "role", "")).lower() not in {"manager", "admin"}:
            raise serializers.ValidationError("Le manager doit avoir le role manager ou admin.")
        return value
