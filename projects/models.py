from django.db import models
from teams.models import Team
from django.conf import settings


class Project(models.Model):
    STATUS_PLANNED = "PLANNED"
    STATUS_ACTIVE = "ACTIVE"
    STATUS_ON_HOLD = "ON_HOLD"
    STATUS_COMPLETED = "COMPLETED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_CHOICES = [
        (STATUS_PLANNED, "Planifié"),
        (STATUS_ACTIVE, "Actif"),
        (STATUS_ON_HOLD, "En pause"),
        (STATUS_COMPLETED, "Terminé"),
        (STATUS_CANCELLED, "Annulé"),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_projects",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PLANNED)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="projects")

    class Meta:
        unique_together = ("name", "team")

    def calculate_progress(self):
        """
        Return completion percentage based on DONE tasks.
        """
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = self.tasks.filter(status="DONE").count()
        return int((completed_tasks / total_tasks) * 100)

    def __str__(self):
        return self.name
