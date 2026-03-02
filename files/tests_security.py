from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project
from teams.models import Team
from .models import ProjectFile

User = get_user_model()


class ProjectFileSecurityTests(APITestCase):
    def setUp(self):
        self.uploader = User.objects.create_user(
            username="uploader",
            email="uploader@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.teammate = User.objects.create_user(
            username="teammate",
            email="teammate@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.outsider = User.objects.create_user(
            username="outsider",
            email="outsider@example.com",
            password="StrongPass123",
            role="MEMBER",
        )
        self.admin = User.objects.create_user(
            username="admin_file",
            email="admin_file@example.com",
            password="StrongPass123",
            role="ADMIN",
        )

        self.team_a = Team.objects.create(name="Team File A")
        self.team_b = Team.objects.create(name="Team File B")
        self.team_a.members.add(self.uploader, self.teammate)
        self.team_b.members.add(self.outsider)

        self.project_a = Project.objects.create(
            name="Project File A",
            description="desc",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="ACTIVE",
            team=self.team_a,
        )

    def _auth(self, username, password="StrongPass123"):
        response = self.client.post(
            "/api/auth/login/",
            {"username": username, "password": password},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_upload_valid_pdf_201(self):
        self._auth("uploader")
        uploaded = SimpleUploadedFile("spec.pdf", b"%PDF-1.4 fake", content_type="application/pdf")
        response = self.client.post(
            "/api/project-files/",
            {"project": self.project_a.id, "file": uploaded},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProjectFile.objects.count(), 1)

    def test_upload_invalid_file_type_400(self):
        self._auth("uploader")
        uploaded = SimpleUploadedFile("note.txt", b"hello", content_type="text/plain")
        response = self.client.post(
            "/api/project-files/",
            {"project": self.project_a.id, "file": uploaded},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_not_uploader_not_admin_403(self):
        file_obj = ProjectFile.objects.create(
            project=self.project_a,
            uploaded_by=self.uploader,
            file=SimpleUploadedFile("a.pdf", b"%PDF-1.4 fake", content_type="application/pdf"),
        )
        self._auth("teammate")
        response = self.client.delete(f"/api/project-files/{file_obj.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_download_forbidden_outside_team_403(self):
        file_obj = ProjectFile.objects.create(
            project=self.project_a,
            uploaded_by=self.uploader,
            file=SimpleUploadedFile("b.pdf", b"%PDF-1.4 fake", content_type="application/pdf"),
        )
        self._auth("outsider")
        response = self.client.get(f"/api/project-files/{file_obj.id}/download/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
