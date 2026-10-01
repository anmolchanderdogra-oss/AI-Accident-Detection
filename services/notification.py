import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config
from models.database import get_db_connection, get_incident_by_id, get_emergency_contacts

def build_emergency_message(incident):
    incident_id = incident.get('id')
    confidence_pct = int(float(incident.get('confidence', 0)) * 100)
    detected_at = incident.get('detected_at', datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'))

    lat = incident.get('latitude')
    lon = incident.get('longitude')
    if lat is not None and lon is not None:
        map_link = f"https://www.google.com/maps?q={lat},{lon}"
        location_text = f"{lat:.6f}, {lon:.6f}\nMap Link: {map_link}"
    else:
        location_text = "Coordinates pending or unavailable (Camera GPS permission not granted)."
        map_link = None

    evidence = incident.get('evidence', [])
    evidence_name = evidence[0]['file_path'] if evidence else 'N/A'

    body = f"""EMERGENCY ALERT: PROBABLE ROAD ACCIDENT DETECTED

Incident ID: #{incident_id}
Time of Incident: {detected_at}
AI Confidence Score: {confidence_pct}%
Incident Status: PROBABLE ACCIDENT
Location: {location_text}
Evidence Snapshot: {evidence_name}

This alert was generated automatically by the AI-Based Accident Detection and Safety Guard System.
Emergency responders or designated contacts please verify immediately.
"""
    return {
        "subject": f"🚨 CRITICAL ALERT: Probable Accident Detected #{incident_id} ({confidence_pct}% Confidence)",
        "body": body,
        "map_link": map_link,
        "confidence_pct": confidence_pct
    }

def send_smtp_email(to_email, subject, body_text):
    if not Config.SMTP_USER or not Config.SMTP_PASSWORD:
        return False, "SMTP credentials not configured (simulation mode active)"

    try:
        msg = MIMEMultipart()
        msg['From'] = Config.ALERT_EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body_text, 'plain'))

        server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True, "Delivered via SMTP"
    except Exception as e:
        return False, str(e)

def dispatch_incident_alert(incident_id):
    incident = get_incident_by_id(incident_id)
    if not incident:
        return {"error": "Incident not found"}

    contacts = get_emergency_contacts()
    enabled_contacts = [c for c in contacts if c.get('enabled')]

    msg_data = build_emergency_message(incident)
    results = []

    conn = get_db_connection()
    cursor = conn.cursor()

    for contact in enabled_contacts:
        contact_id = contact['id']
        email = contact.get('email')
        phone = contact.get('phone')

        # Determine channel
        channel = 'email' if email else 'sms_demo'
        status = 'pending'
        error_msg = None
        provider_msg_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"

        if email and Config.SMTP_USER:
            success, info = send_smtp_email(email, msg_data['subject'], msg_data['body'])
            status = 'sent' if success else 'failed'
            error_msg = None if success else info
        else:
            # High-fidelity simulated dispatch for Demo/Testing without requiring paid SMS/SMTP
            status = 'sent'
            error_msg = "Simulated delivery (Mock Responders Gateway)"

        sent_time = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute('''
        INSERT INTO alerts (incident_id, contact_id, channel, status, provider_message_id, sent_at, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (incident_id, contact_id, channel, status, provider_msg_id, sent_time, error_msg))

        results.append({
            "contact_name": contact.get('name'),
            "destination": email or phone,
            "channel": channel,
            "status": status,
            "provider_message_id": provider_msg_id,
            "error": error_msg
        })

    conn.commit()
    conn.close()

    return {
        "incident_id": incident_id,
        "dispatched_count": len(results),
        "details": results
    }
