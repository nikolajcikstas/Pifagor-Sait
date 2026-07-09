import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("EMAIL_SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
NOTIFICATION_EMAIL = os.getenv("NOTIFICATION_EMAIL", "")


def send_lead_notification(name: str, phone: str, subject_name: str = "", message: str = "") -> bool:
    if not EMAIL_USER or not EMAIL_PASSWORD or not NOTIFICATION_EMAIL:
        logger.warning("Email notification not configured — skipping")
        return False

    body = f"""
Новая заявка с сайта Пифагор

Имя: {name}
Телефон: {phone}
"""

    if subject_name:
        body += f"Предмет: {subject_name}\n"

    if message:
        body += f"Сообщение: {message}\n"

    msg = MIMEMultipart()
    msg["From"] = EMAIL_USER
    msg["To"] = NOTIFICATION_EMAIL
    msg["Subject"] = f"Новая заявка от {name}"

    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.info("Notification sent to %s about lead from %s", NOTIFICATION_EMAIL, name)
        return True
    except Exception as e:
        logger.error("Failed to send notification email: %s", e)
        return False
