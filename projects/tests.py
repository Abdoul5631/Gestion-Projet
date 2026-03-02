from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from teams.models import Team
from .models import Project

User = get_user_model()


class ProjectAPITestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="manager", email="manager@example.com", password="StrongPass123", role="MANAGER"
        )
        self.team = Team.objects.create(name="Team P", description="desc")
        self.team.members.add(self.manager)

    def _login(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "manager", "password": "StrongPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_manager_can_create_project(self):
        self._login()
        payload = {
            "name": "Projet 1",
            "description": "desc",
            "start_date": "2026-01-01",
            "end_date": "2026-02-01",
            "status": "PLANNED",
            "team": self.team.id,
        }
        response = self.client.post("/api/projects/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 1)

    def test_report_endpoint(self):
        self._login()
        project = Project.objects.create(
            name="Projet 2",
            description="desc",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="ACTIVE",
            team=self.team,
        )
        response = self.client.get(f"/api/projects/{project.id}/report/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("task_status_summary", response.data)
