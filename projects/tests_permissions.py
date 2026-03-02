from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from teams.models import Team
from .models import Project

User = get_user_model()


class ProjectAccessPermissionTests(APITestCase):
    def setUp(self):
        self.member_a = User.objects.create_user(
            username="member_a",
            email="member_a@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.member_b = User.objects.create_user(
            username="member_b",
            email="member_b@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.admin = User.objects.create_user(
            username="admin_perm",
            email="admin_perm@example.com",
            password="StrongPass123",
            role="ADMIN",
        )

        self.team_a = Team.objects.create(name="Team Perm A", description="A")
        self.team_b = Team.objects.create(name="Team Perm B", description="B")
        self.team_a.members.add(self.member_a)
        self.team_b.members.add(self.member_b)

        self.project_a = Project.objects.create(
            name="Project A",
            description="desc a",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="ACTIVE",
            team=self.team_a,
        )
        self.project_b = Project.objects.create(
            name="Project B",
            description="desc b",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="PLANNED",
            team=self.team_b,
        )

    def _auth(self, username, password="StrongPass123"):
        response = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": password},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_member_sees_only_own_team_projects_200(self):
        self._auth("member_a")
        response = self.client.get("/api/projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = []
        for row in response.data.get("results", []):
            names.append(row["name"])
        self.assertIn("Project A", names)
        self.assertNotIn("Project B", names)

    def test_member_cannot_access_other_team_project_403(self):
        self._auth("member_a")
        response = self.client.get(f"/api/projects/{self.project_b.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_generate_report_for_own_team(self):
        mgr = User.objects.create_user(
            username="mgr", email="mgr@example.com", password="StrongPass123", role="MANAGER"
        )
        # make him member of team_a
        self.team_a.members.add(mgr)
        self._auth("mgr")
        # list should include project_a
        list_resp = self.client.get("/api/projects/")
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        names = [row["name"] for row in list_resp.data.get("results", [])]
        self.assertIn("Project A", names)
        # request report for project_a
        report_resp = self.client.get(f"/api/projects/{self.project_a.id}/report/")
        self.assertEqual(report_resp.status_code, status.HTTP_200_OK)
        self.assertIn("total_tasks", report_resp.data)

    def test_manager_cannot_report_other_team_403(self):
        mgr2 = User.objects.create_user(
            username="mgr2", email="mgr2@example.com", password="StrongPass123", role="MANAGER"
        )
        self.team_b.members.add(mgr2)
        self._auth("mgr2")
        report_resp = self.client.get(f"/api/projects/{self.project_a.id}/report/")
        self.assertEqual(report_resp.status_code, status.HTTP_403_FORBIDDEN)
