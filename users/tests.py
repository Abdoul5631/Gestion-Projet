from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAPITestCase(APITestCase):
    def test_register_and_login(self):
        payload = {
            "username": "member1",
            "email": "member1@example.com",
            "password": "StrongPass123",
            "role": "MEMBER",
        }
        response = self.client.post(reverse("register"), payload, format="json")
        if response.status_code != status.HTTP_201_CREATED:
            print("REGISTER ERROR", response.status_code, response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)

        login_res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "member1", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_res.data)

    def test_me_endpoint(self):
        user = User.objects.create_user(
            username="u1", email="u1@example.com", password="StrongPass123", role="MEMBER"
        )
        login_res = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "u1", "password": "StrongPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_res.data['access']}")
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "u1")

    def setup_admin(self):
        admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="AdminPass123", role=User.ROLE_ADMIN
        )
        login = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "admin", "password": "AdminPass123"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        return admin

    def test_admin_crud_and_actions(self):
        admin = self.setup_admin()
        # create a new user
        payload = {"username": "newuser", "email": "new@example.com", "password": "StrongPass123", "role": "MANAGER"}
        resp = self.client.post("/api/users/", payload, format="json")
        if resp.status_code != status.HTTP_201_CREATED:
            print("ADMIN CREATE ERROR", resp.status_code, resp.data)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user_id = resp.data["id"]

        # modify user fields and role
        update_payload = {"email": "updated@example.com", "role": "admin"}
        resp2 = self.client.patch(f"/api/users/{user_id}/", update_payload, format="json")
        if resp2.status_code != status.HTTP_200_OK:
            print("ADMIN UPDATE ERROR", resp2.status_code, resp2.data)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data["email"], "updated@example.com")
        self.assertEqual(resp2.data["role"], "admin")

        # deactivate user
        resp3 = self.client.patch(f"/api/users/{user_id}/deactivate/", format="json")
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
        self.assertFalse(resp3.data["is_active"])

        # activate again (just sanity)
        resp4 = self.client.patch(f"/api/users/{user_id}/activate/", format="json")
        self.assertEqual(resp4.status_code, status.HTTP_200_OK)
        self.assertTrue(resp4.data["is_active"])

        # delete user
        resp5 = self.client.delete(f"/api/users/{user_id}/")
        self.assertEqual(resp5.status_code, status.HTTP_204_NO_CONTENT)
