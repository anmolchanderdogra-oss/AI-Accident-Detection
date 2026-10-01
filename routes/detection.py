import os
import uuid
import base64
import json
import cv2
import numpy as np
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from services.video_processor import process_video_file, process_single_frame, detector

detection_bp = Blueprint('detection', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

@detection_bp.route('/api/detect/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file format. Allowed: {', '.join(Config.ALLOWED_EXTENSIONS)}"}), 400

    orig_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{orig_name}"
    save_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
    file.save(save_path)

    # Parse optional location data
    location_data = None
    lat = request.form.get('latitude')
    lon = request.form.get('longitude')
    if lat and lon:
        try:
            location_data = {
                'latitude': float(lat),
                'longitude': float(lon),
                'accuracy': float(request.form.get('accuracy', 0)),
                'source': request.form.get('source', 'browser')
            }
        except ValueError:
            pass

    # Process video
    result = process_video_file(save_path, orig_name, location_data=location_data)

    return jsonify({
        "status": "success",
        "result": result
    })

@detection_bp.route('/api/detect/frame', methods=['POST'])
def analyze_frame():
    data = request.get_json(silent=True) or {}
    image_data = data.get('image')

    if not image_data:
        return jsonify({"error": "No image frame data provided"}), 400

    try:
        # Decode base64 frame (e.g. data:image/jpeg;base64,...)
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Failed to decode frame image"}), 400

        location_data = data.get('location')
        result = process_single_frame(frame, source_name="webcam_stream", location_data=location_data)

        return jsonify({
            "status": "success",
            "detection": result
        })
    except Exception as e:
        return jsonify({"error": f"Inference error: {str(e)}"}), 500

@detection_bp.route('/api/detect/status', methods=['GET'])
def get_detector_status():
    threshold, req_frames, cooldown = detector.reload_settings()
    return jsonify({
        "status": "READY",
        "engine": "YOLO" if detector.has_custom_model else "CV_Shockwave_Heuristic",
        "threshold": threshold,
        "required_frames": req_frames,
        "cooldown_seconds": cooldown,
        "positive_frames_count": detector.positive_frames
    })

@detection_bp.route('/api/detect/reset', methods=['POST'])
def reset_detector_state():
    detector.reset_state()
    return jsonify({"status": "success", "message": "Detection state reset successfully"})
