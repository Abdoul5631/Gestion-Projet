from pathlib import Path
from rest_framework import serializers
from .models import ProjectFile
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from projects.models import Project  # adapte si nécessaire


class ProjectFileUploadSerializer(serializers.ModelSerializer):

    uploaded_by_username = serializers.CharField(
        source="uploaded_by.username",
        read_only=True
    )

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "project",
            "file",
            "upload_date",   # ⚠️ doit correspondre EXACTEMENT au model
            "uploaded_by",
            "uploaded_by_username",
        ]
        read_only_fields = [
            "id",
            "project",
            "upload_date",   # ⚠️ même nom que dans le modèle
            "uploaded_by",
            "uploaded_by_username",
        ]

    def validate_file(self, value):
        allowed_ext = {".pdf", ".docx"}
        allowed_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }

        ext = Path(value.name).suffix.lower()
        content_type = getattr(value, "content_type", None)

        if ext not in allowed_ext:
            raise serializers.ValidationError(
                "Extension invalide. Seuls .pdf et .docx sont autorisés."
            )

        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Type MIME invalide. Utilisez application/pdf ou "
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document."
            )

        return value
    
        
    def create(self, validated_data):
        return ProjectFile.objects.create(**validated_data)