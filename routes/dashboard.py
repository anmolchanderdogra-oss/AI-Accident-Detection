from flask import Blueprint, render_template, jsonify
from models.database import get_incidents, get_settings, get_emergency_contacts, get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def index():
    return render_template('index.html')

@dashboard_bp.route('/api/health')
def health_check():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM incidents')
    total_incidents = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM alerts WHERE status = "sent"')
    total_alerts = cursor.fetchone()[0]
    cursor.execute('SELECT COUNT(*) FROM emergency_contacts WHERE enabled = 1')
    active_contacts = cursor.fetchone()[0]
    conn.close()

    settings = get_settings()

    return jsonify({
        "status": "ONLINE",
        "system": "AI Accident Guard Core",
        "metrics": {
            "total_incidents": total_incidents,
            "alerts_dispatched": total_alerts,
            "active_contacts": active_contacts,
            "threshold": float(settings.get('accident_threshold', 0.70)),
            "required_frames": int(settings.get('required_positive_frames', 3)),
            "cooldown_sec": int(settings.get('cooldown_seconds', 60))
        }
    })
