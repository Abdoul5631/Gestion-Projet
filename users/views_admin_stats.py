from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import User
from projects.models import Project

class UsersCountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"count": User.objects.count()})

class ProjectsCountView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"count": Project.objects.filter(status="ACTIVE").count()})
