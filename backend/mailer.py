import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv

load_dotenv()

MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"

def send_email( to_email, subject, html_body, attachment=None ):
    try:
        message = MIMEMultipart()
        message["From"] = MAIL_USERNAME
        message["To"] = to_email
        message["Subject"] = subject

        message.attach(MIMEText(html_body, "html"))
        if attachment:
            with open(attachment, "rb") as file:
                part = MIMEBase( "application", "octet-stream")
                part.set_payload(file.read())
            encoders.encode_base64(part)
            part.add_header(
        "Content-Disposition",
        f'attachment; filename="{os.path.basename(attachment)}"'
    )
            message.attach(part)
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        if MAIL_USE_TLS:
            server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.send_message(message)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print("Email Error:", e)
        return False