from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task
from teams.models import Team
from .models import Project

User = get_user_model()


class AcademicSpecTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="spec_admin",
            email="spec_admin@example.com",
            password="StrongPass123",
            role="ADMIN",
        )
        self.manager = User.objects.create_user(
            username="spec_manager",
            email="spec_manager@example.com",
            password="StrongPass123",
            role="MANAGER",
        )
        self.member = User.objects.create_user(
            username="spec_member",
            email="spec_member@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.outsider = User.objects.create_user(
            username="spec_outsider",
            email="spec_outsider@example.com",
            password="StrongPass123",
            role="MEMBER",
        )

        self.team = Team.objects.create(name="Spec Team", description="spec")
        self.team.members.add(self.manager, self.member)
        self.project = Project.objects.create(
            name="Spec Project",
            description="spec project",
            start_date="2026-01-01",
            end_date="2026-03-01",
            status="ACTIVE",
            team=self.team,
        )

    def _auth(self, username):
        response = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": "StrongPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_message_creation(self):
        self._auth("spec_member")
        response = self.client.post(
            f"/api/projects/{self.project.id}/messages/",
            {"content": "Bonjour équipe"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_file_upload(self):
        self._auth("spec_member")
        uploaded = SimpleUploadedFile("spec.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        response = self.client.post(
            f"/api/projects/{self.project.id}/files/",
            {"file": uploaded},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_report_endpoint_manager(self):
        Task.objects.create(
            title="T1",
            project=self.project,
            assigned_to=self.member,
            status="DONE",
            priority="HIGH",
        )
        Task.objects.create(
            title="T2",
            project=self.project,
            assigned_to=self.member,
            status="TODO",
            priority="MEDIUM",
        )
        self._auth("spec_manager")
        response = self.client.get(f"/api/projects/{self.project.id}/report/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("progress_percentage", response.data)
        self.assertIn("tasks_by_member", response.data)

    def test_progress_calculation(self):
        Task.objects.create(
            title="Done Task",
            project=self.project,
            assigned_to=self.member,
            status="DONE",
            priority="HIGH",
        )
        Task.objects.create(
            title="Todo Task",
            project=self.project,
            assigned_to=self.member,
            status="TODO",
            priority="LOW",
        )
        self.assertEqual(self.project.calculate_progress(), 50)
