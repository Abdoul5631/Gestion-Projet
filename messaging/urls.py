from rest_framework.routers import DefaultRouter

from .views import MessageViewSet

router = DefaultRouter()
router.register(r"", MessageViewSet, basename="messages")

urlpatterns = router.urls
