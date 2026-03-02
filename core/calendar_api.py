from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from tasks.models import Task
from projects.models import Project
from projects.serializers import ProjectSerializer


class CalendarEventSerializer:
    @staticmethod
    def serialize_task(task):
        return {
            "type": "task",
            "id": task.id,
            "title": task.title,
            "due_date": task.due_date,
            "project": task.project.id if task.project else None,
            "project_name": task.project.name if task.project else None,
            "status": task.status,
        }

    @staticmethod
    def serialize_project_date(project, which):
        # which: 'start' or 'end'
        if which == "start":
            return {
                "type": "project_start",
                "id": project.id,
                "title": f"Début projet: {project.name}",
                "date": project.start_date,
                "project": project.id,
                "project_name": project.name,
                "status": project.status,
            }
        else:
            return {
                "type": "project_end",
                "id": project.id,
                "title": f"Fin projet: {project.name}",
                "date": project.end_date,
                "project": project.id,
                "project_name": project.name,
                "status": project.status,
            }

class CalendarAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = str(getattr(user, "role", "")).lower()
        events = []
        if role == "admin":
            tasks = Task.objects.select_related("project").all()
            projects = Project.objects.all()
        elif role == "manager":
            projects = Project.objects.filter(manager=user)
            tasks = Task.objects.filter(project__manager=user)
        else:  # member
            # Projets où le membre appartient à l'équipe
            projects = Project.objects.filter(team__members=user).distinct()
            tasks = Task.objects.filter(assigned_to=user)

        # Tâches (deadlines)
        for task in tasks:
            events.append(CalendarEventSerializer.serialize_task(task))

        # Dates importantes des projets (début/fin)
        for project in projects:
            if project.start_date:
                events.append(CalendarEventSerializer.serialize_project_date(project, "start"))
            if project.end_date:
                events.append(CalendarEventSerializer.serialize_project_date(project, "end"))

        return Response(events)
