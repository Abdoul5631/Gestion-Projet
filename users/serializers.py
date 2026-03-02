from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    # override default field so we can normalize case before choice validation
    role = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]
        read_only_fields = ["id"]

    def validate_role(self, value):
        # normalize case and reject admin creation
        value = str(value).strip().lower()
        if value == "admin":
            return User.ROLE_MEMBER
        if value not in {User.ROLE_MANAGER, User.ROLE_MEMBER}:
            return User.ROLE_MEMBER
        return value

    def create(self, validated_data):
        role = validated_data.get("role", User.ROLE_MEMBER)
        if role == User.ROLE_ADMIN:
            role = User.ROLE_MEMBER
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            role=role,
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    teams = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_active", "teams"]
        read_only_fields = ["id"]
