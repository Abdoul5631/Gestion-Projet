from rest_framework.routers import DefaultRouter

from .project_file_views import ProjectFileUploadViewSet
from .views import ProjectFileViewSet

router = DefaultRouter()
router.register(r"files", ProjectFileViewSet, basename="files")
router.register(r"project-files", ProjectFileUploadViewSet, basename="project-files")

urlpatterns = router.urls
