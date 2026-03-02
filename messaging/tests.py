from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from projects.models import Project
from teams.models import Team
from .models import Message

User = get_user_model()


class MessageAPITestCase(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="msg_member", email="msg_member@example.com", password="StrongPass123", role="MEMBER"
        )
        self.team = Team.objects.create(name="Team M")
        self.team.members.add(self.member)
        self.project = Project.objects.create(
            name="Projet M",
            description="desc",
            start_date="2026-01-01",
            end_date="2026-02-01",
            status="ACTIVE",
            team=self.team,
        )

    def _login(self):
        res = self.client.post(
            "/api/auth/login/",
            {"username": "msg_member", "password": "StrongPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_member_can_send_message(self):
        self._login()
        response = self.client.post(
            "/api/messages/",
            {"content": "Bonjour equipe", "project": self.project.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)
