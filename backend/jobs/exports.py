import csv
import os
import tempfile

from models import User, Booking
from mailer import send_email

def export_booking_history(user_id):
    user = User.query.get(user_id)
    if not user:
        return
    bookings = Booking.query.filter_by(
        user_id=user_id
    ).all()
    temp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".csv",
        mode="w",
        newline="",
        encoding="utf-8"
    )
    writer = csv.writer(temp)

    writer.writerow([
        "User ID",
        "Trek Name",
        "Location",
        "Booking Status",
        "Booking Date"
    ])

    for booking in bookings:
        writer.writerow([
            user.id,
            booking.trek.name,
            booking.trek.location,
            booking.status,
            booking.booking_date.strftime("%Y-%m-%d")
        ])

    temp.close()
    html = f"""
    <html>
        <body>
            <h2>Your Trekking History is Ready</h2>
            <p>Hello <b>{user.full_name}</b>,</p>
            <p> Your booking history has been generated successfully. Please find the CSV attached. </p>
        </body>
    </html>"""

    send_email(
        user.email,
        "Booking History Export",
        html,
        attachment=temp.name
    )

    os.remove(temp.name)
    print(f"CSV exported for {user.email}")