from models import db, User, Trek, Booking
from mailer import send_email
from sqlalchemy import func
import os
from dotenv import load_dotenv

load_dotenv()

def send_monthly_report():
    admin_email = os.getenv("ADMIN_EMAIL")
    # Statistics
    total_treks = Trek.query.count()
    completed_treks = Trek.query.filter_by( status="Completed" ).count()
    open_treks = Trek.query.filter_by( status="Open" ).count()
    total_users = User.query.filter_by( role="trekker" ).count()
    total_staff = User.query.filter_by( role="staff" ).count()
    total_bookings = Booking.query.count()
    booked = Booking.query.filter_by( status="Booked" ).count()
    cancelled = Booking.query.filter_by( status="Cancelled" ).count()
    completed_bookings = Booking.query.filter_by( status="Completed" ).count()
    # Top Treks
    popular_treks = (
        db.session.query(
            Trek.name,
            func.count(Booking.id).label("count")
        )
        .join(Booking)
        .group_by(Trek.id)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )

    # HTML

    html = f"""
    <html>
        <body style="font-family:Arial">
            <h2>Monthly Trekking Report</h2>
            <hr>
            <table border="1" cellpadding="8">
                <tr>
                    <td>Total Treks</td>
                    <td>{total_treks}</td>
                </tr>
                <tr>
                    <td>Completed Treks</td>
                    <td>{completed_treks}</td>
                </tr>
                <tr>
                    <td>Open Treks</td>
                    <td>{open_treks}</td>
                </tr>
                <tr>
                    <td>Total Trekkers</td>
                    <td>{total_users}</td>
                </tr>
                <tr>
                    <td>Total Staff</td>
                    <td>{total_staff}</td>
                </tr>
                <tr>
                    <td>Total Bookings</td>
                    <td>{total_bookings}</td>
                </tr>
                <tr>
                    <td>Booked</td>
                    <td>{booked}</td>
                </tr>
                <tr>
                    <td>Completed Bookings</td>
                    <td>{completed_bookings}</td>
                </tr>
                <tr>
                    <td>Cancelled Bookings</td>
                    <td>{cancelled}</td>
                </tr>
            </table> <br>
        <h3>Top 5 Popular Treks</h3>
        <ol>"""
    for trek in popular_treks:
        html += f"<li>{trek.name} ({trek.count} bookings)</li>"
    html += """
    </ol>
    <hr>
    <p>Generated Automatically by Trekking Management Application</p>
    </body>
</html>"""

    send_email(
        admin_email,
        "Monthly Trekking Activity Report",
        html
    )
    print("Monthly Report Sent Successfully.")