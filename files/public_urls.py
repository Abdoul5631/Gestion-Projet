from django.urls import path

from .project_file_views import ProjectFileUploadViewSet

project_files_list = ProjectFileUploadViewSet.as_view({"get": "list", "post": "create"})
project_files_detail = ProjectFileUploadViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)
project_files_download = ProjectFileUploadViewSet.as_view({"get": "download"})

urlpatterns = [
    path("project-files", project_files_list, name="project-files-list-public-noslash"),
    path("project-files/", project_files_list, name="project-files-list-public"),
    path("project-files/<int:pk>", project_files_detail, name="project-files-detail-public-noslash"),
    path("project-files/<int:pk>/", project_files_detail, name="project-files-detail-public"),
    path("project-files/<int:pk>/download", project_files_download, name="project-files-download-public-noslash"),
    path("project-files/<int:pk>/download/", project_files_download, name="project-files-download-public"),
]
