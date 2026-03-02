from rest_framework.routers import DefaultRouter

from .project_file_views import ProjectFileUploadViewSet

router = DefaultRouter()
router.register(r"", ProjectFileUploadViewSet, basename="project-files")

urlpatterns = router.urls
