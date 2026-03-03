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

    def test_admin_team_creation_adds_creator_to_members(self):
        # if an admin creates a team without specifying any members or
        # manager the API should still make the creator a member so that
        # team lists filtered by membership (used by non-admin clients)
        # will return the newly created object to the same user.
        self._login("admin", "StrongPass123")
        response = self.client.post("/api/teams/", {"name": "Team B"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        team = Team.objects.get(name="Team B")
        self.assertIn(self.admin, team.members.all())

    def test_admin_can_delete_team(self):
        # create a team then delete it as admin
        self._login("admin", "StrongPass123")
        resp = self.client.post("/api/teams/", {"name": "DeleteMe"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        team_id = resp.data["id"]
        del_resp = self.client.delete(f"/api/teams/{team_id}/")
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Team.objects.filter(id=team_id).exists())

    def test_list_reflects_deletion(self):
        # Regression test for a queryset caching issue.  When the same
        # queryset instance was reused across requests, a list call prior to
        # deletion could cache results and subsequent list operations (even
        # by an admin) would return stale entries.  Exercise the sequence of
        # list->delete->list to ensure the second GET doesn't show the
        # removed team.
        self._login("admin", "StrongPass123")
        create = self.client.post("/api/teams/", {"name": "Bye"}, format="json")
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        tid = create.data["id"]
        # fetch once to potentially populate any cache
        initial = self.client.get("/api/teams/")
        self.assertIn(tid, [t["id"] for t in initial.data])
        # delete the team
        del_resp = self.client.delete(f"/api/teams/{tid}/")
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        # list again and confirm it's gone
        later = self.client.get("/api/teams/")
        self.assertNotIn(tid, [t["id"] for t in later.data])
