from rest_framework import serializers

from files.models import ProjectFile
from messaging.models import Message
from .models import Project


class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = "__all__"
        read_only_fields = ["uploaded_by", "project", "uploaded_at"]


class ProjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "manager",
            "start_date",
            "end_date",
            "status",
            "team",
            "progress",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "name": {"help_text": "Nom du projet (unique dans une equipe)."},
            "description": {"help_text": "Description fonctionnelle du projet."},
            "manager": {"help_text": "Identifiant du manager responsable du projet."},
            "start_date": {"help_text": "Date de debut du projet (YYYY-MM-DD)."},
            "end_date": {"help_text": "Date de fin prevue du projet (YYYY-MM-DD)."},
            "status": {"help_text": "Statut actuel du projet."},
            "team": {"help_text": "Identifiant de l'equipe liee au projet."},
        }

    def get_progress(self, obj):
        return obj.calculate_progress()

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("La date de fin doit etre >= date de debut.")

        manager = attrs.get("manager", getattr(self.instance, "manager", None))
        if manager and str(getattr(manager, "role", "")).lower() not in {"manager", "admin"}:
            raise serializers.ValidationError({"manager": "Le manager doit avoir le role manager ou admin."})
        return attrs


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = ["sender", "project", "created_at"]
