# AI-Based Accident Detection and Emergency Alert System (with 3D Spatial UI)

[![System: Online](https://img.shields.io/badge/System-ONLINE-27AE60?style=for-the-badge)](http://localhost:5000)
[![Tech: Python & OpenCV](https://img.shields.io/badge/Stack-Python%20%7C%20OpenCV%20%7C%20Flask-2BA8A2?style=for-the-badge)](http://localhost:5000)
[![UI: Flip7 + 3D Skill](https://img.shields.io/badge/Design-Flip7%20%2B%203D%20Canvas-FFD23F?style=for-the-badge)](http://localhost:5000)

An autonomous road safety platform that monitors uploaded traffic video files and real-time camera streams using Computer Vision and Deep Learning to detect vehicle collisions in milliseconds. When an accident is detected above a configurable confidence threshold over consecutive frames, the system captures evidence snapshots, acquires GPS location via the browser Geolocation API, and dispatches emergency alerts to designated contacts — **all without requiring expensive IoT hardware**.

---

## Key Features

1. **Autonomous Collision Detection**:
   - OpenCV video decoding and frame-by-frame analysis.
   - Dual-mode AI inference engine: supports custom Ultralytics YOLO (`.pt`) deep learning weights, backed by an intelligent Computer Vision optical-flow shockwave heuristic engine.
   - **Temporal Consecutive-Frame Logic**: Requires $N$ consecutive positive frames before triggering an alert, eliminating false alarms from camera shake or single-frame anomalies.
   - **Smart Cooldown Mechanism**: Prevents repetitive alert spam for the same collision event.

2. **No-IoT Emergency Alert & Geolocation**:
   - Leverages browser Geolocation API (`navigator.geolocation`) to record exact coordinates ($latitude, longitude$).
   - Generates instant clickable navigation links (`https://www.google.com/maps?q={lat},{lon}`).
   - Multi-channel notification dispatcher with audit logging in SQLite.

3. **Flip7 Design System & 3D Interactive Telemetry**:
   - Designed using the **Flip7 Design System** color tokens (Teal `#2BA8A2`, Gold `#FFD23F`, and Coral `#EF6C4A` for the active accident alert state).
   - **3D Spatial Roadway Radar**: Interactive 3D perspective canvas (`scene3d.js`) inspired by the **3D Website Skill** featuring dynamic mouse perspective tilt, animated 3D traffic vehicles, depth vectors, and collision shockwave rings.
   - Built-in Web Audio API siren alert synthesizer.
   - Filterable incident history command center with evidence inspection modal.

---

## System Architecture

```text
[Browser Frontend (3D Hero + Flip7 HUD + Video Studio)]
      |                                  ^
      | Upload / Webcam Frames / GPS     | Realtime Telemetry & Alerts
      v                                  |
[Flask Backend Engine]
   ├── API Routes (/api/detect, /api/incidents, /api/alerts, /api/settings)
   ├── Video Processor (OpenCV frame extraction & temporal windowing)
   ├── AI Accident Detector (Confidence scoring, temporal trigger logic)
   ├── Evidence Capture Manager (Annotated snapshot generator -> evidence/)
   ├── Geolocation Resolver (Browser GPS coordinates -> Google Maps)
   ├── Alert Dispatcher (Emergency contacts notification engine)
   └── SQLite Database (Incidents, Evidence, Locations, Contacts, Settings)
```

---

## Quickstart Guide

### 1. Requirements & Setup
Ensure you have Python 3.8+ installed.

```bash
# Clone or navigate to the project directory
cd "AI-Based Accident Detection"

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py
```

Open your browser and navigate to:
**`http://localhost:5000`**

---

## Using the System

1. **Interactive 3D Telemetry**:
   - Hover and move your cursor over the 3D Hero canvas to tilt the spatial road grid in 3D.
   - Click **"Test 3D Radar Shockwave"** or simulate a crash to witness the spatial collision target reticle.

2. **Video Upload Detection**:
   - Drag & drop or upload an MP4/AVI/MOV video file in the Detection Studio.
   - The system processes frames, plots confidence, annotates collision evidence, and logs incidents.

3. **Live Camera Detection**:
   - Click **"Start Live Camera"** to connect your webcam.
   - The HUD displays real-time AI probability and the confidence gauge reacts instantly.

4. **Incident Command Center**:
   - View past incidents, filter by status (`All`, `Detected`, `Reviewed`).
   - Click **"Details"** on any incident to inspect the evidence photo, open the Google Maps pin, review the alert dispatch audit log, and update status.

5. **Settings & Emergency Contacts**:
   - Click **"Settings & Contacts"** in the top navigation to add new emergency responders or customize the AI sensitivity threshold slider.

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Dashboard interface |
| `GET` | `/api/health` | System health check and telemetry counters |
| `POST` | `/api/detect/upload` | Upload & analyze video file with optional GPS data |
| `POST` | `/api/detect/frame` | Real-time webcam frame analysis |
| `GET` | `/api/detect/status` | Detector status, thresholds, and cooldown state |
| `GET` | `/api/incidents` | Fetch paginated, filterable incident list |
| `GET` | `/api/incidents/<id>` | Detailed incident information with evidence & alerts |
| `POST` | `/api/incidents/<id>/status` | Update status (`reviewed`, `false_alarm`) |
| `GET` | `/api/contacts` | List configured emergency contacts |
| `POST` | `/api/contacts` | Add new emergency contact |
| `DELETE` | `/api/contacts/<id>` | Delete contact |
| `POST` | `/api/alerts/send/<id>` | Dispatch emergency alert for incident |
| `GET` | `/api/settings` | Get current detection thresholds |
| `POST` | `/api/settings` | Update thresholds (`accident_threshold`, etc.) |
