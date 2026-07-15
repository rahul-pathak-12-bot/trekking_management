from celery_app import celery
from app import create_app
from jobs.reminders import send_daily_reminders
from jobs.reports import send_monthly_report
from jobs.exports import export_booking_history

app = create_app()

@celery.task
def daily_reminder_task():
    with app.app_context():
        send_daily_reminders()

@celery.task
def monthly_report_task():
    with app.app_context():
        send_monthly_report()

@celery.task
def export_booking_history_task(user_id):
    with app.app_context():
        export_booking_history(user_id)