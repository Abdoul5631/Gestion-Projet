from django.conf import settings
from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_teams",
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="teams", blank=True)

    def __str__(self):
        return self.name
