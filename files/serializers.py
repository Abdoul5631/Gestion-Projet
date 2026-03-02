from rest_framework import serializers
from .models import ProjectFile


class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    uploaded_at = serializers.DateTimeField(source="upload_date", read_only=True)

    class Meta:
        model = ProjectFile
        fields = ["id", "file", "upload_date", "uploaded_at", "project", "uploaded_by", "uploaded_by_username"]
        read_only_fields = ["id", "upload_date", "uploaded_by", "uploaded_by_username"]
