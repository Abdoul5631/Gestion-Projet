from django.contrib import admin
from .models import ProjectFile


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "uploaded_by", "upload_date")
    list_filter = ("project",)
