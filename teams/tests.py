from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Team

User = get_user_model()


class TeamAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="StrongPass123", role="ADMIN"
        )
        self.member = User.objects.create_user(
            username="member", email="member@example.com", password="StrongPass123", role="MEMBER"
        )

    def _login(self, username, password):
        res = self.client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_admin_can_create_team(self):
        self._login("admin", "StrongPass123")
        response = self.client.post(
            "/api/teams/",
            {"name": "Team A", "description": "Equipe A", "members": [self.admin.id, self.member.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Team.objects.count(), 1)

    def test_member_cannot_create_team(self):
        self._login("member", "StrongPass123")
        response = self.client.post("/api/teams/", {"name": "Nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
