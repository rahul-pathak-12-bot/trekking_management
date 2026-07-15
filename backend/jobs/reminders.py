from models import User, Trek, Booking
from mailer import send_email
from datetime import date, timedelta

def send_daily_reminders():
    tomorrow = date.today() + timedelta(days=1)
    treks = Trek.query.filter(
        Trek.start_date == tomorrow,
        Trek.status == "Open"
    ).all()
    print(f"Found {len(treks)} trek(s).")
    for trek in treks:
        bookings = Booking.query.filter_by(
            trek_id=trek.id,
            status="Booked"
        ).all()
        for booking in bookings:
            user = User.query.get(booking.user_id)
            if not user:
                continue
            html = f"""
            <html>
                <body style="font-family:Arial">
                    <h2>Trek Reminder</h2>
                    <p>Hello <b>{user.full_name}</b>,</p>
                    <p> Your trek <b>{trek.name}</b> starts tomorrow.</p>
                    <table border="1" cellpadding="8">
                        <tr>
                            <td>Location</td>
                            <td>{trek.location}</td>
                        </tr>
                        <tr>
                            <td>Start Date</td>
                            <td>{trek.start_date}</td>
                        </tr>
                        <tr>
                            <td>Duration</td>
                            <td>{trek.duration} Day(s)</td>
                        </tr>
                    </table> <br>
                    <h3>Things to Carry</h3>
                    <ul>
                        <li>Water Bottle</li>
                        <li>Trekking Shoes</li>
                        <li>ID Card</li>
                        <li>Raincoat</li>
                    </ul>
                    <p> Happy Trekking! </p>
                </body>
            </html>"""

            send_email(
                user.email,
                "Upcoming Trek Reminder",
                html
            )

    print("Reminder Job Finished.")