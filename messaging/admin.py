from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "project", "timestamp")
    search_fields = ("content",)
    list_filter = ("project",)
