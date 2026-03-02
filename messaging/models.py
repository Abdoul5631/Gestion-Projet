from django.conf import settings
from django.db import models
from projects.models import Project


class Message(models.Model):
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="messages")

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.sender} - {self.project}"
