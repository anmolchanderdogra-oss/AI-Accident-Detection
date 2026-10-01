import os
import time
import uuid
import cv2
import numpy as np
from datetime import datetime, timezone
from config import Config
from models.database import create_incident, add_evidence, create_location
from services.detector import detector, AccidentDetector
from services.notification import dispatch_incident_alert

def annotate_accident_frame(frame, confidence, boxes=None, timestamp_str=None):
    """
    Applies modern visual telemetry overlay (Flip7 coral theme) to the evidence frame.
    """
    annotated = frame.copy()
    h, w = annotated.shape[:2]

    # Draw semi-transparent header bar
    overlay = annotated.copy()
    cv2.rectangle(overlay, (0, 0), (w, 60), (30, 30, 30), -1)
    cv2.addWeighted(overlay, 0.7, annotated, 0.3, 0, annotated)

    # Coral alert banner (#EF6C4A -> BGR: 74, 108, 239)
    coral_bgr = (74, 108, 239)
    cv2.rectangle(annotated, (0, 0), (8, 60), coral_bgr, -1)

    text_title = "PROBABLE ACCIDENT DETECTED"
    cv2.putText(annotated, text_title, (24, 28), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)

    conf_pct = int(confidence * 100)
    text_meta = f"AI CONFIDENCE: {conf_pct}%  |  TIME: {timestamp_str or datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"
    cv2.putText(annotated, text_meta, (24, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.48, coral_bgr, 1)

    # Draw bounding boxes if present
    if boxes:
        for b in boxes:
            x1, y1, x2, y2 = b.get("bbox", [0, 0, 0, 0])
            is_acc = b.get("is_accident", True)
            box_color = coral_bgr if is_acc else (230, 180, 40)
            thickness = 3 if is_acc else 2
            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, thickness)
            label = str(b.get('label', 'Collision'))
            cv2.putText(annotated, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.52, box_color, 2)
    else:
        # Subtle framing border in coral
        cv2.rectangle(annotated, (10, 65), (w - 10, h - 10), coral_bgr, 2)

    return annotated

def process_video_file(video_path, filename, location_data=None):
    """
    Processes an uploaded video file frame-by-frame:
    - Runs inference
    - Detects accidents with temporal consecutive-frame criteria
    - Generates evidence snapshots
    - Persists incidents and sends alerts
    - Returns timeline data for frontend graphs
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Failed to decode video file"}

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps if total_frames > 0 else 0

    detector.reset_state()

    timeline = []
    incidents_detected = []
    frame_idx = 0
    sample_stride = max(1, int(fps / 5))  # Sample ~5 frames per second for speed

    # Store location if provided
    location_id = None
    if location_data and 'latitude' in location_data and 'longitude' in location_data:
        location_id = create_location(
            lat=float(location_data['latitude']),
            lon=float(location_data['longitude']),
            accuracy=float(location_data.get('accuracy', 0)),
            source=location_data.get('source', 'browser')
        )

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % sample_stride == 0:
            current_sec = round(frame_idx / fps, 2)
            confidence, boxes, details = detector.predict(frame)
            should_trigger, pos_count, cd = detector.update_temporal_trigger(confidence, current_time=time.time())

            timeline.append({
                "time_sec": current_sec,
                "confidence": round(confidence, 3),
                "is_positive": confidence >= detector.threshold,
                "triggered": should_trigger
            })

            if should_trigger:
                timestamp_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
                annotated = annotate_accident_frame(frame, confidence, boxes, timestamp_str)

                evidence_filename = f"evidence_{uuid.uuid4().hex[:10]}.jpg"
                evidence_path = os.path.join(Config.EVIDENCE_FOLDER, evidence_filename)
                cv2.imwrite(evidence_path, annotated)

                incident_id = create_incident(
                    source_type="upload",
                    source_name=filename,
                    confidence=round(confidence, 3),
                    detected_at=timestamp_str,
                    location_id=location_id
                )
                add_evidence(incident_id, evidence_filename, file_type="image")

                # Dispatch emergency alert
                alert_result = dispatch_incident_alert(incident_id)

                incidents_detected.append({
                    "incident_id": incident_id,
                    "time_sec": current_sec,
                    "confidence": round(confidence, 3),
                    "evidence_file": evidence_filename,
                    "alert_result": alert_result
                })

        frame_idx += 1

    cap.release()

    return {
        "filename": filename,
        "duration_sec": round(duration_sec, 2),
        "total_frames": total_frames,
        "samples_analyzed": len(timeline),
        "incidents": incidents_detected,
        "timeline": timeline
    }

def process_single_frame(frame, source_name="webcam", location_data=None, is_webcam=True):
    """
    Processes a single frame from webcam/live stream.
    Returns live prediction, temporal trigger status, and newly created incident if triggered.
    """
    confidence, boxes, details = detector.predict(frame, is_webcam=is_webcam)
    should_trigger, pos_count, cooldown_remaining = detector.update_temporal_trigger(confidence, current_time=time.time())

    incident_created = None
    if should_trigger:
        location_id = None
        if location_data and 'latitude' in location_data and 'longitude' in location_data:
            location_id = create_location(
                lat=float(location_data['latitude']),
                lon=float(location_data['longitude']),
                accuracy=float(location_data.get('accuracy', 0)),
                source=location_data.get('source', 'browser')
            )

        timestamp_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        annotated = annotate_accident_frame(frame, confidence, boxes, timestamp_str)
        evidence_filename = f"live_evidence_{uuid.uuid4().hex[:10]}.jpg"
        evidence_path = os.path.join(Config.EVIDENCE_FOLDER, evidence_filename)
        cv2.imwrite(evidence_path, annotated)

        incident_id = create_incident(
            source_type="webcam",
            source_name=source_name,
            confidence=round(confidence, 3),
            detected_at=timestamp_str,
            location_id=location_id
        )
        add_evidence(incident_id, evidence_filename, file_type="image")
        alert_result = dispatch_incident_alert(incident_id)

        incident_created = {
            "id": incident_id,
            "confidence": round(confidence, 3),
            "evidence_file": evidence_filename,
            "detected_at": timestamp_str,
            "alert_result": alert_result
        }

    return {
        "confidence": round(confidence, 3),
        "boxes": boxes,
        "details": details,
        "positive_frames": pos_count,
        "cooldown_remaining": cooldown_remaining,
        "is_accident": confidence >= detector.threshold,
        "incident": incident_created
    }
