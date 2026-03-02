from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from projects.models import Project
from teams.models import Team
from .models import ProjectFile

User = get_user_model()


class FileAPITestCase(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="file_member", email="file_member@example.com", password="StrongPass123", role="MEMBER"
        )
        self.team = Team.objects.create(name="Team F")
        self.team.members.add(self.member)
        self.project = Project.objects.create(
            name="Projet F",
            description="desc",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="ACTIVE",
            team=self.team,
        )

    def _login(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "file_member", "password": "StrongPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_member_can_upload_file(self):
        self._login()
        uploaded = SimpleUploadedFile("note.txt", b"hello world", content_type="text/plain")
        response = self.client.post(
            "/api/files/",
            {"file": uploaded, "project": self.project.id},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProjectFile.objects.count(), 1)
