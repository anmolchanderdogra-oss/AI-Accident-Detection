import os
import time
import math
import cv2
import numpy as np
from config import Config
from models.database import get_settings

# Try loading torch & ultralytics
try:
    import torch
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

# COCO vehicle classes supported by YOLO detection
VEHICLE_CLASSES = {
    1: 'bicycle',
    2: 'car',
    3: 'motorcycle',
    5: 'bus',
    7: 'truck'
}

# COCO indoor, personal and office classes to identify benign webcam/indoor scenes
INDOOR_OR_HUMAN_CLASSES = {
    0: 'person',
    56: 'chair',
    57: 'couch',
    58: 'potted plant',
    59: 'bed',
    60: 'dining table',
    61: 'toilet',
    62: 'tv',
    63: 'laptop',
    64: 'mouse',
    65: 'remote',
    66: 'keyboard',
    67: 'cell phone',
    73: 'book',
    74: 'clock',
    75: 'vase',
    84: 'toothbrush'
}

class AccidentDetector:
    def __init__(self, model_path=None):
        self.model_path = model_path or Config.MODEL_PATH
        self.classifier = None
        self.vehicle_detector = None
        self.has_custom_model = False
        self.has_vehicle_detector = False
        self.model_type = "unknown"
        self.threshold = Config.ACCIDENT_THRESHOLD
        self.required_frames = Config.REQUIRED_POSITIVE_FRAMES
        self.cooldown_seconds = Config.COOLDOWN_SECONDS

        # Temporal logic state
        self.positive_frames = 0
        self.last_trigger_time = 0
        self.prev_frame_gray = None
        self.prev_flow_magnitude = 0.0

        self._load_models()

    def _load_models(self):
        # 1. Load Accident Classifier (best.pt)
        if not self.model_path or not os.path.exists(self.model_path):
            self.model_path = Config.MODEL_PATH

        if HAS_YOLO and os.path.exists(self.model_path):
            try:
                self.classifier = YOLO(self.model_path)
                self.has_custom_model = True
                task = getattr(self.classifier, 'task', 'classify' if 'cls' in str(self.model_path).lower() else 'detect')
                self.model_type = task
                print(f"[Detector] Loaded custom YOLO classifier ({task}) from {self.model_path}")
            except Exception as e:
                print(f"[Detector] Failed to load custom classifier: {e}")
                self.has_custom_model = False
                self.classifier = None

        # 2. Load Vehicle & Context Object Detector (yolo11n.pt or yolov8n.pt)
        if HAS_YOLO:
            detector_weights = "yolo11n.pt"
            if not os.path.exists(detector_weights):
                base_cand = os.path.join(Config.BASE_DIR, "yolo11n.pt")
                if os.path.exists(base_cand):
                    detector_weights = base_cand

            try:
                self.vehicle_detector = YOLO(detector_weights)
                self.has_vehicle_detector = True
                print(f"[Detector] Loaded vehicle context detector from {detector_weights}")
            except Exception as e:
                print(f"[Detector] Note: Standard vehicle detector could not load: {e}")
                self.has_vehicle_detector = False
                self.vehicle_detector = None

    def reload_settings(self):
        settings = get_settings()
        self.threshold = float(settings.get('accident_threshold', Config.ACCIDENT_THRESHOLD))
        self.required_frames = int(settings.get('required_positive_frames', Config.REQUIRED_POSITIVE_FRAMES))
        self.cooldown_seconds = int(settings.get('cooldown_seconds', Config.COOLDOWN_SECONDS))
        return self.threshold, self.required_frames, self.cooldown_seconds

    def predict(self, frame, is_webcam=False):
        """
        Multi-Modal Accident Detection Pipeline:
        1. Context & Object Detection (yolo11n.pt): Identifies vehicles, persons, and indoor objects.
        2. Specialized Accident Classifier (best.pt): Evaluates road crash probability.
        3. Motion Shockwave (Optical Flow): Analyzes sudden kinetic impacts and surges.
        4. Context-Aware Decision Fusion:
           - Completely suppresses false alarms when a person or indoor objects are in front of the camera with no vehicles.
           - Reliably triggers on real vehicle collisions, vehicle-pedestrian strikes, and road impacts.
        """
        if frame is None:
            return 0.0, [], {"error": "Empty frame"}

        t_start = time.time()
        boxes = []
        vehicles = []
        persons = []
        indoor_items = []
        h, w = frame.shape[:2]

        # -------------------------------------------------------------
        # 1. Specialized Accident Classifier (best.pt)
        # -------------------------------------------------------------
        p_accident = 0.0
        p_normal = 1.0
        if self.has_custom_model and self.classifier:
            try:
                cls_results = self.classifier(frame, verbose=False)
                for r in cls_results:
                    if hasattr(r, 'probs') and r.probs is not None:
                        probs = r.probs.data.tolist()
                        names = r.names or {}
                        for cid, cname in names.items():
                            cname_str = str(cname).lower()
                            if any(term in cname_str for term in ['accident', 'crash', 'collision']):
                                p_accident = float(probs[cid])
                            elif 'normal' in cname_str:
                                p_normal = float(probs[cid])
            except Exception as e:
                print(f"[Detector] Classifier inference error: {e}")

        # -------------------------------------------------------------
        # 2. Context & Vehicle Detection (yolo11n.pt)
        # -------------------------------------------------------------
        if self.has_vehicle_detector and self.vehicle_detector:
            try:
                det_res = self.vehicle_detector(frame, verbose=False, conf=0.20)[0]
                if det_res.boxes is not None and len(det_res.boxes) > 0:
                    for b in det_res.boxes:
                        cls_id = int(b.cls[0])
                        conf = float(b.conf[0])
                        xyxy = [int(v) for v in b.xyxy[0]]
                        if cls_id in VEHICLE_CLASSES:
                            v_name = VEHICLE_CLASSES[cls_id]
                            vehicles.append({
                                "bbox": xyxy,
                                "label": f"{v_name.upper()} {int(conf * 100)}%",
                                "confidence": round(conf, 2),
                                "cls_id": cls_id,
                                "is_accident": False
                            })
                        elif cls_id == 0:
                            persons.append({
                                "bbox": xyxy,
                                "label": f"PERSON {int(conf * 100)}%",
                                "confidence": round(conf, 2),
                                "cls_id": 0,
                                "is_accident": False
                            })
                        elif cls_id in INDOOR_OR_HUMAN_CLASSES:
                            indoor_items.append({
                                "bbox": xyxy,
                                "label": INDOOR_OR_HUMAN_CLASSES[cls_id],
                                "confidence": round(conf, 2),
                                "cls_id": cls_id
                            })
            except Exception as e:
                print(f"[Detector] Vehicle detection error: {e}")

        # -------------------------------------------------------------
        # 3. Optical Flow & Motion Shockwave Analysis
        # -------------------------------------------------------------
        shockwave_metric = 0.0
        small = cv2.resize(frame, (320, 240))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (7, 7), 0)

        if self.prev_frame_gray is not None:
            flow = cv2.calcOpticalFlowFarneback(self.prev_frame_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
            avg_mag = float(np.mean(mag))
            std_mag = float(np.std(mag))
            diff_score = float(np.mean(cv2.absdiff(self.prev_frame_gray, gray)))

            surge = abs(avg_mag - self.prev_flow_magnitude)
            shockwave_metric = (surge * 3.5) + (std_mag * 2.8) + (diff_score * 0.15)
            self.prev_flow_magnitude = avg_mag

        self.prev_frame_gray = gray

        # -------------------------------------------------------------
        # 4. Multi-Modal Decision Fusion
        # -------------------------------------------------------------
        final_confidence = 0.03
        has_overlap = False
        pedestrian_hit = False

        # Check vehicle-vehicle collision overlap
        if len(vehicles) > 1:
            for i in range(len(vehicles)):
                for j in range(i + 1, len(vehicles)):
                    b1 = vehicles[i]['bbox']
                    b2 = vehicles[j]['bbox']
                    ix1 = max(b1[0], b2[0])
                    iy1 = max(b1[1], b2[1])
                    ix2 = min(b1[2], b2[2])
                    iy2 = min(b1[3], b2[3])
                    if ix2 > ix1 and iy2 > iy1:
                        inter_area = (ix2 - ix1) * (iy2 - iy1)
                        area1 = max(1, (b1[2] - b1[0]) * (b1[3] - b1[1]))
                        area2 = max(1, (b2[2] - b2[0]) * (b2[3] - b2[1]))
                        overlap_ratio = inter_area / float(min(area1, area2))
                        if overlap_ratio > 0.10:
                            has_overlap = True
                            vehicles[i]['is_accident'] = True
                            vehicles[j]['is_accident'] = True
                            vehicles[i]['label'] = f"CRASH: {vehicles[i]['label']}"
                            vehicles[j]['label'] = f"CRASH: {vehicles[j]['label']}"

        # Check vehicle-pedestrian impact
        if len(vehicles) > 0 and len(persons) > 0:
            for v in vehicles:
                for p in persons:
                    b1, b2 = v['bbox'], p['bbox']
                    ix1, iy1 = max(b1[0], b2[0]), max(b1[1], b2[1])
                    ix2, iy2 = min(b1[2], b2[2]), min(b1[3], b2[3])
                    if ix2 > ix1 and iy2 > iy1:
                        inter_area = (ix2 - ix1) * (iy2 - iy1)
                        area_p = max(1, (b2[2] - b2[0]) * (b2[3] - b2[1]))
                        if (inter_area / float(area_p)) > 0.15:
                            pedestrian_hit = True
                            v['is_accident'] = True
                            p['is_accident'] = True
                            p['label'] = f"COLLISION RISK: PEDESTRIAN"

        # Check if environment is human / indoor webcam
        is_human_or_indoor = (len(persons) > 0 or len(indoor_items) > 0 or is_webcam)

        # -------------------------------------------------------------
        # Decision branches:
        # -------------------------------------------------------------
        # SCENARIO 1: Person in front of camera or indoor setting with NO vehicles
        if len(vehicles) == 0 and is_human_or_indoor:
            # Under no circumstances is a person sitting at a camera an automobile crash
            final_confidence = 0.02
            for p in persons:
                p['is_accident'] = False
                p['label'] = f"PERSON (SAFE) {int(p['confidence'] * 100)}%"
                boxes.append(p)

        # SCENARIO 2: No vehicles and no objects detected (empty room, wall, background)
        elif len(vehicles) == 0:
            # Without vehicles, best.pt out-of-distribution noise is strictly suppressed
            final_confidence = min(0.10, max(0.02, p_accident * 0.10))

        # SCENARIO 3: Vehicles present - Real traffic road scenario!
        elif has_overlap or pedestrian_hit:
            # High-confidence confirmed impact
            final_confidence = max(0.88, p_accident)
            boxes.extend(vehicles)
            if pedestrian_hit:
                boxes.extend([p for p in persons if p.get('is_accident')])

        elif p_accident >= self.threshold and p_accident > p_normal:
            # Custom accident model detects crash on actual vehicle scene
            final_confidence = p_accident
            if not any(b.get('is_accident') for b in vehicles):
                vehicles[0]['is_accident'] = True
                vehicles[0]['label'] = f"IMPACT RISK: {vehicles[0]['label']}"
            boxes.extend(vehicles)

        elif shockwave_metric > 18.0:
            # Kinetic impact shockwave with vehicles present
            final_confidence = min(0.92, 0.55 + (shockwave_metric / 40.0))
            if final_confidence >= self.threshold:
                vehicles[0]['is_accident'] = True
                vehicles[0]['label'] = f"KINETIC IMPACT: {vehicles[0]['label']}"
            boxes.extend(vehicles)

        elif len(vehicles) > 0:
            # Normal traffic with vehicles moving safely
            boxes.extend(vehicles)
            final_confidence = min(0.30, max(0.04, p_accident * 0.30))

        else:
            final_confidence = 0.03

        inference_time_ms = round((time.time() - t_start) * 1000, 2)
        engine_name = "Dual_YOLO_Context" if (self.has_vehicle_detector and self.has_custom_model) else (
            f"YOLO_{self.model_type}" if self.has_custom_model else "CV_Motion"
        )

        return round(final_confidence, 3), boxes, {
            "inference_ms": inference_time_ms,
            "engine": engine_name,
            "vehicles_detected": len(vehicles),
            "persons_detected": len(persons),
            "p_accident_raw": round(p_accident, 3),
            "shockwave_metric": round(shockwave_metric, 2)
        }

    def update_temporal_trigger(self, confidence, current_time=None):
        """
        Temporal trigger rule:
        Requires REQUIRED_POSITIVE_FRAMES above ACCIDENT_THRESHOLD
        and enforces COOLDOWN_SECONDS before re-triggering.
        """
        if current_time is None:
            current_time = time.time()

        threshold, required_frames, cooldown_seconds = self.reload_settings()

        elapsed_since_last = current_time - self.last_trigger_time
        in_cooldown = elapsed_since_last < cooldown_seconds
        cooldown_remaining = max(0, int(cooldown_seconds - elapsed_since_last)) if in_cooldown else 0

        if confidence >= threshold:
            self.positive_frames += 1
        else:
            self.positive_frames = max(0, self.positive_frames - 1)

        should_trigger = False
        if self.positive_frames >= required_frames and not in_cooldown:
            should_trigger = True
            self.last_trigger_time = current_time
            self.positive_frames = 0  # Reset counter after event trigger

        return should_trigger, self.positive_frames, cooldown_remaining

    def reset_state(self):
        self.positive_frames = 0
        self.prev_frame_gray = None
        self.prev_flow_magnitude = 0.0

detector = AccidentDetector()
