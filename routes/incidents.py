import os
from flask import Blueprint, request, jsonify, send_from_directory, abort
from config import Config
from models.database import get_incidents, get_incident_by_id, update_incident_status

incidents_bp = Blueprint('incidents', __name__)

@incidents_bp.route('/api/incidents', methods=['GET'])
def list_incidents():
    limit = int(request.args.get('limit', 50))
    status = request.args.get('status')
    if status == 'all' or not status:
        status = None

    incidents = get_incidents(limit=limit, status=status)
    return jsonify({
        "status": "success",
        "count": len(incidents),
        "incidents": incidents
    })

@incidents_bp.route('/api/incidents/<int:incident_id>', methods=['GET'])
def incident_details(incident_id):
    incident = get_incident_by_id(incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404
    return jsonify({
        "status": "success",
        "incident": incident
    })

@incidents_bp.route('/api/incidents/<int:incident_id>/status', methods=['POST', 'PATCH'])
def change_incident_status(incident_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')
    if not new_status or new_status not in ['detected', 'reviewed', 'false_alarm', 'resolved']:
        return jsonify({"error": "Invalid status value"}), 400

    incident = get_incident_by_id(incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    update_incident_status(incident_id, new_status)
    return jsonify({
        "status": "success",
        "message": f"Incident #{incident_id} marked as {new_status}"
    })

@incidents_bp.route('/api/incidents/clear', methods=['POST'])
def clear_all_incidents():
    from models.database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM alerts')
    cursor.execute('DELETE FROM evidence')
    cursor.execute('DELETE FROM incidents')
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": "Incident history reset successfully"})

@incidents_bp.route('/evidence/<path:filename>')
def serve_evidence(filename):
    safe_filename = os.path.basename(filename)
    evidence_dir = Config.EVIDENCE_FOLDER
    if not os.path.exists(os.path.join(evidence_dir, safe_filename)):
        abort(404)
    return send_from_directory(evidence_dir, safe_filename)
