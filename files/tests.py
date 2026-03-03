from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from projects.models import Project
from teams.models import Team
from .models import ProjectFile


def _unwrap(res):
    data = res.data
    if isinstance(data, dict):
        return data.get("results", [])
    return data

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

    def test_admin_sees_manager_and_member_uploads(self):
        # create additional users and team membership
        self.manager = User.objects.create_user(username="mgr", email="mgr@example.com", password="StrongPass123", role="MANAGER")
        self.admin = User.objects.create_user(username="admin", email="admin@example.com", password="StrongPass123", role="ADMIN")
        self.team.members.add(self.manager)
        
        # manager upload
        self.client.post("/api/auth/login/", {"username": "mgr", "password": "StrongPass123"}, format="json")
        token = self.client.post("/api/auth/login/", {"username": "mgr", "password": "StrongPass123"}, format="json").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        up1 = SimpleUploadedFile("m.pdf", b"%PDF-1.4 a", content_type="application/pdf")
        r1 = self.client.post(f"/api/projects/{self.project.id}/files/", {"file": up1}, format="multipart")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        id1 = r1.data["id"]
        
        # member upload
        self.client.post("/api/auth/login/", {"username": "file_member", "password": "StrongPass123"}, format="json")
        tok2 = self.client.post("/api/auth/login/", {"username": "file_member", "password": "StrongPass123"}, format="json").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok2}")
        up2 = SimpleUploadedFile("m2.pdf", b"%PDF-1.4 b", content_type="application/pdf")
        r2 = self.client.post(f"/api/projects/{self.project.id}/files/", {"file": up2}, format="multipart")
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        id2 = r2.data["id"]
        
        # admin list
        self.client.post("/api/auth/login/", {"username": "admin", "password": "StrongPass123"}, format="json")
        tok3 = self.client.post("/api/auth/login/", {"username": "admin", "password": "StrongPass123"}, format="json").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok3}")
        lst = self.client.get("/api/files/")
        ids = [f["id"] for f in _unwrap(lst)]
        self.assertIn(id1, ids)
        self.assertIn(id2, ids)

    def test_admin_list_reflects_delete(self):
        self.admin = User.objects.create_user(username="admin2", email="a2@example.com", password="StrongPass123", role="ADMIN")
        obj = ProjectFile.objects.create(project=self.project, file=SimpleUploadedFile("x.txt", b"x"), uploaded_by=self.admin)
        fid = obj.id
        # admin view
        self.client.post("/api/auth/login/", {"username": "admin2", "password": "StrongPass123"}, format="json")
        tok = self.client.post("/api/auth/login/", {"username": "admin2", "password": "StrongPass123"}, format="json").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
        first = self.client.get("/api/files/")
        ids1 = [f["id"] for f in _unwrap(first)]
        self.assertIn(fid, ids1)
        self.client.delete(f"/api/files/{fid}/")
        later = self.client.get("/api/files/")
        ids2 = [f["id"] for f in _unwrap(later)]
        self.assertNotIn(fid, ids2)
