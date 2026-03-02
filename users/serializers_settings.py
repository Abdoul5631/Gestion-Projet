from rest_framework import serializers
from .models_settings import UserSettings

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ["email_notifications", "task_reminder_notifications"]
