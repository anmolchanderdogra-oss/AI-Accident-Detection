# Technical Requirements Document (TRD)
## AI-Based Accident Detection and Emergency Alert System

### 1. Architecture
```text
[Webcam / Uploaded Video]
          |
          v
      [OpenCV]
          |
          v
 [Frame Pre-processing]
          |
          v
 [Deep Learning Model]
          |
          v
 [Detection + Temporal Logic]
       /       \
     No         Yes
     |           |
 Continue     Evidence
                 |
        +--------+--------+
        |                 |
     Location          Database
        |                 |
        +--------+--------+
                 |
                 v
          [Flask Backend]
                 |
          [Alert Service]
                 |
      [Emergency Contacts]
```

### 2. Recommended Technology
| Layer | Technology |
|---|---|
| Language | Python 3.x |
| AI | PyTorch/Ultralytics YOLO or TensorFlow |
| Computer Vision | OpenCV |
| Backend | Flask |
| Frontend | HTML, CSS, JavaScript |
| Database | SQLite for MVP; PostgreSQL for production |
| Location | Browser Geolocation API |
| Maps | OpenStreetMap/Google Maps link |
| Notifications | Email SMTP or approved SMS API |
| Deployment | Linux VPS / cloud platform |

### 3. Functional Technical Requirements
#### Video
- Decode video with OpenCV.
- Sample frames at a configurable FPS.
- Resize frames to model input size.
- Handle corrupted/unsupported videos gracefully.

#### Model
The model should expose:
- `predict(frame)`
- accident confidence
- optional bounding boxes
- inference time

Recommended initial approach:
- YOLO-based image/frame classifier or detector.
- Add temporal aggregation in application logic.
- Later replace with a video/sequence model if required.

#### Temporal Trigger Logic
Do not trigger from one uncertain frame.

Example:
```python
if confidence >= THRESHOLD:
    positive_frames += 1
else:
    positive_frames = max(0, positive_frames - 1)

if positive_frames >= REQUIRED_FRAMES and not cooldown_active:
    create_incident()
```

Suggested initial configuration:
- `THRESHOLD = 0.70`
- `REQUIRED_FRAMES = 3`
- `COOLDOWN_SECONDS = 60`

These values must be validated against the project dataset.

### 4. Flask Modules
```text
app/
├── __init__.py
├── routes/
│   ├── dashboard.py
│   ├── detection.py
│   ├── incidents.py
│   └── alerts.py
├── services/
│   ├── detector.py
│   ├── video_processor.py
│   ├── location.py
│   └── notification.py
├── models/
│   └── database.py
├── templates/
├── static/
└── config.py
```

### 5. API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Dashboard |
| POST | `/api/detect/upload` | Upload and analyze video |
| POST | `/api/detect/start` | Start live detection |
| POST | `/api/detect/stop` | Stop live detection |
| GET | `/api/detection/status` | Current AI status |
| POST | `/api/location` | Save current browser location |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/<id>` | Incident details |
| POST | `/api/alerts/send/<id>` | Send/retry alert |
| GET | `/api/health` | Health check |

### 6. Location Design
Browser JavaScript:
```javascript
navigator.geolocation.getCurrentPosition(
  position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    // POST coordinates to Flask
  },
  error => {
    // Use fallback/manual/demo location
  }
);
```

Location must be treated as optional. The application should continue working when permission is denied.

### 7. Security Requirements
- Validate uploads by extension and MIME/content where possible.
- Limit upload size.
- Store secrets in environment variables.
- Do not hard-code API keys.
- Protect admin routes with authentication.
- Sanitize filenames.
- Restrict access to evidence files.
- Use HTTPS in production.
- Log security-relevant failures.

### 8. Performance Requirements
- UI should remain responsive while inference runs.
- Use a background worker/thread/process for long video jobs.
- Avoid loading an entire video into RAM.
- Store only necessary evidence.
- Provide progress/status to the frontend.

### 9. Error Handling
The system must handle:
- Camera unavailable.
- Invalid video.
- Model missing.
- Model inference failure.
- Database unavailable.
- Location permission denied.
- Notification failure.
- Duplicate incident trigger.

### 10. Environment Variables
```text
FLASK_SECRET_KEY=
DATABASE_URL=
MODEL_PATH=
ACCIDENT_THRESHOLD=0.70
REQUIRED_FRAMES=3
COOLDOWN_SECONDS=60
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

### 11. Production Note
For a real deployment, use PostgreSQL, HTTPS, authentication, persistent object/file storage, structured logging, backups, and a proper worker architecture. Do not describe the system as a certified emergency-response device without appropriate validation and regulatory review.
