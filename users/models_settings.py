from django.db import models
from django.conf import settings

class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settings")
    email_notifications = models.BooleanField(default=True)
    task_reminder_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"Settings for {self.user.username}"
