"""
Run this on a schedule (see README for Render Cron Job / crontab / Celery
beat setup). It's intentionally idempotent and cheap to run every 5-10
minutes: it only actually sends an email to a user once their configured
send-time has arrived AND they haven't already been emailed today.

Example crontab (every 10 min):
    */10 * * * * cd /path/to/backend && /path/to/venv/bin/python manage.py send_daily_emails

Example Render Cron Job command (runs every 10 min, schedule: '*/10 * * * *'):
    python manage.py send_daily_emails
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Profile
from notifications.services import build_and_send_daily_email


class Command(BaseCommand):
    help = "Sends the daily weather/AQI/route email to users whose scheduled time has arrived."

    def handle(self, *args, **options):
        now_local = timezone.localtime()  # Asia/Kolkata, per settings.TIME_ZONE
        today = now_local.date()

        candidates = Profile.objects.filter(
            email_enabled=True,
            email_hour=now_local.hour,
        ).exclude(last_emailed_on=today)

        # Only send within the same 10-min window as the user's chosen minute,
        # so this works whether the cron runs every 5 or every 10 minutes.
        sent_count, skipped, failed = 0, 0, 0
        for profile in candidates:
            if abs(profile.email_minute - now_local.minute) > 9:
                continue
            ok, reason = build_and_send_daily_email(profile)
            if ok:
                profile.last_emailed_on = today
                profile.save(update_fields=["last_emailed_on"])
                sent_count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent to {profile.user.username}"))
            else:
                skipped += 1
                self.stdout.write(self.style.WARNING(f"Skipped {profile.user.username}: {reason}"))

        self.stdout.write(self.style.SUCCESS(
            f"Done. Sent={sent_count} Skipped={skipped} at {now_local.isoformat()}"
        ))
