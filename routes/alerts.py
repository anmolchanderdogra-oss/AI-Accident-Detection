from flask import Blueprint, request, jsonify
from models.database import (
    get_emergency_contacts, add_emergency_contact, delete_emergency_contact,
    get_settings, update_setting, get_incident_by_id
)
from services.notification import dispatch_incident_alert
from services.detector import detector

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/api/contacts', methods=['GET'])
def list_contacts():
    contacts = get_emergency_contacts()
    return jsonify({
        "status": "success",
        "contacts": contacts
    })

@alerts_bp.route('/api/contacts', methods=['POST'])
def create_contact():
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()

    if not name:
        return jsonify({"error": "Contact name is required"}), 400
    if not phone and not email:
        return jsonify({"error": "At least one contact method (phone or email) is required"}), 400

    contact_id = add_emergency_contact(name, phone, email, enabled=1)
    return jsonify({
        "status": "success",
        "contact_id": contact_id,
        "message": f"Emergency contact '{name}' added successfully"
    })

@alerts_bp.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def remove_contact(contact_id):
    delete_emergency_contact(contact_id)
    return jsonify({
        "status": "success",
        "message": f"Contact #{contact_id} removed successfully"
    })

@alerts_bp.route('/api/alerts/send/<int:incident_id>', methods=['POST'])
def send_alert(incident_id):
    incident = get_incident_by_id(incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    result = dispatch_incident_alert(incident_id)
    return jsonify({
        "status": "success",
        "alert_dispatch": result
    })

@alerts_bp.route('/api/settings', methods=['GET'])
def fetch_settings():
    settings = get_settings()
    return jsonify({
        "status": "success",
        "settings": settings
    })

@alerts_bp.route('/api/settings', methods=['POST'])
def save_settings():
    data = request.get_json(silent=True) or {}
    for key, val in data.items():
        update_setting(key, val)

    # Refresh detector's cached settings
    detector.reload_settings()

    return jsonify({
        "status": "success",
        "message": "Settings updated successfully",
        "current_settings": get_settings()
    })
