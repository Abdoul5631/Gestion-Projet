from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "team", "status", "start_date", "end_date")
    search_fields = ("name",)
    list_filter = ("status", "team")
