from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class JWTAuthenticationTests(APITestCase):
    def setUp(self):
        User.objects.create_user(
            username="jwt_user",
            email="jwt_user@example.com",
            password="StrongPass123",
            role="MEMBER",
        )

    def test_jwt_login_success_200(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "jwt_user", "password": "StrongPass123"},
            format="json",
        )
        print("STATUS:", response.status_code)
        print("URL:", getattr(response, "url", "NO URL"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)