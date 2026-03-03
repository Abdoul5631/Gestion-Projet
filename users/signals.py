from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_settings(sender, instance, created, **kwargs):
    """Automatically provision a corresponding UserSettings record.

    The import is performed inside the handler because ``UserSettings``
    lives in the same app and importing it at module scope triggers the
    ``AppRegistryNotReady`` error during startup.  We only need the
    model when a user is actually saved, so this is safe and avoids the
    earlier UnboundLocalError by performing the import before use.
    """
    if created:
        from .models_settings import UserSettings
        UserSettings.objects.get_or_create(user=instance)
