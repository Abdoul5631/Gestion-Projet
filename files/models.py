from django.conf import settings
from django.db import models
from projects.models import Project


class ProjectFile(models.Model):
    file = models.FileField(upload_to="project_files/")
    upload_date = models.DateTimeField(auto_now_add=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="files")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="uploaded_files")

    def __str__(self):
        return f"File#{self.id} - {self.project.name}"
