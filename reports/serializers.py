from rest_framework import serializers

from .models import Report
from projects.models import Project


class ReportSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "author",
            "author_username",
            "project",
            "project_name",
            "title",
            "content",
            "status",
            "manager_comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # configure queryset after imports to avoid circular problems
        from projects.models import Project
        self.fields["project"].queryset = Project.objects.all()