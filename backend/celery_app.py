import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

def make_celery():
    celery = Celery(
        "trekking_app",
        broker=os.getenv("CELERY_BROKER_URL"),
        backend=os.getenv("CELERY_RESULT_BACKEND"),
        include=["tasks"]
    )

    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="Asia/Kolkata",
        enable_utc=False
    )


    celery.conf.beat_schedule = {
        "daily-reminders": {
            "task": "tasks.daily_reminder_task",
            "schedule": crontab(hour=9, minute=0),
        },

        "monthly-report": {
            "task": "tasks.monthly_report_task",
            "schedule": crontab(
                hour=9,
                minute=0,
                day_of_month=1
            ),
        },
    }
    return celery

celery = make_celery()