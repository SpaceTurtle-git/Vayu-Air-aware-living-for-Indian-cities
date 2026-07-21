from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        from django.contrib.auth.models import User
        from django.db.models.signals import post_save

        def create_profile_if_missing(sender, instance, created, **kwargs):
            from .models import Profile
            if created:
                Profile.objects.get_or_create(user=instance)

        post_save.connect(create_profile_if_missing, sender=User)
