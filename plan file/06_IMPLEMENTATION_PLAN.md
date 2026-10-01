# Implementation Plan
## AI-Based Accident Detection and Emergency Alert System

### Phase 1 — Foundation
**Goal:** Create a working Flask application.

Tasks:
1. Create virtual environment.
2. Install Python dependencies.
3. Create Flask app factory.
4. Create templates/static folders.
5. Add configuration and environment variables.
6. Create base dashboard.
7. Add health-check endpoint.

Deliverable:
- Flask application starts successfully.
- Dashboard loads.

### Phase 2 — Dataset & AI Model
**Goal:** Build the accident detection engine.

Tasks:
1. Collect a legally usable accident/non-accident dataset.
2. Clean and label data.
3. Split into train/validation/test sets.
4. Train/fine-tune the selected model.
5. Evaluate precision, recall and confusion matrix.
6. Export the best model.
7. Create `detector.py`.

Deliverable:
- Model can classify/detect probable accidents on test videos.

### Phase 3 — OpenCV Video Pipeline
**Goal:** Connect the model to video.

Tasks:
1. Read uploaded video with OpenCV.
2. Extract frames.
3. Resize/preprocess frames.
4. Run inference.
5. Overlay confidence/status.
6. Implement temporal trigger logic.
7. Save accident evidence.
8. Add cooldown to prevent duplicate events.

Deliverable:
- Video → OpenCV → AI → incident pipeline works end-to-end.

### Phase 4 — Database
**Goal:** Persist incidents.

Tasks:
1. Create SQLAlchemy models or equivalent.
2. Add incident table.
3. Add evidence table.
4. Add locations table.
5. Add emergency contacts.
6. Add alerts.
7. Create migrations if using PostgreSQL.

Deliverable:
- Every triggered event is saved.

### Phase 5 — Location
**Goal:** Attach location without IoT.

Tasks:
1. Add browser geolocation JavaScript.
2. Request permission.
3. POST coordinates to Flask.
4. Validate latitude/longitude.
5. Store accuracy and source.
6. Generate map link.
7. Add manual/demo fallback.

Deliverable:
- Incident can show a map location when available.

### Phase 6 — Alert System
**Goal:** Notify configured contacts.

MVP:
- Display an emergency alert in the dashboard.
- Save notification status.

Next:
- Email notification.
- SMS provider.
- Other authorized communication provider.

Tasks:
1. Create message template.
2. Fetch enabled contacts.
3. Send notification.
4. Log success/failure.
5. Add retry.
6. Prevent duplicate notification.

Deliverable:
- Alert lifecycle is visible and auditable.

### Phase 7 — UI Polish
**Goal:** Apply the supplied Flip7-inspired design system.

Tasks:
1. Implement CSS variables.
2. Build responsive cards.
3. Add dashboard status components.
4. Add coral accident state.
5. Add gold primary CTA.
6. Add teal normal state.
7. Add colored glow shadows.
8. Add subtle micro-animations.
9. Add accessibility states.

Deliverable:
- Consistent responsive dashboard.

### Phase 8 — Testing
#### Functional Tests
- Valid video upload.
- Invalid video upload.
- Camera unavailable.
- Accident trigger.
- No-accident video.
- Duplicate trigger prevention.
- Evidence creation.
- Database save.
- Location available/unavailable.
- Alert success/failure.

#### AI Evaluation
Measure:
- Precision
- Recall
- F1-score
- False positive rate
- False negative rate
- Inference speed

### Phase 9 — Deployment
Recommended production structure:
```text
Internet
   |
 HTTPS
   |
 Nginx
   |
 Gunicorn
   |
 Flask
   |
 PostgreSQL
   |
 Evidence/Object Storage
```

For a college demo, a simpler Flask deployment is acceptable.

### Suggested Project Structure
```text
accident-detection-system/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .gitignore
├── README.md
├── model/
│   └── accident_model.pt
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── dashboard.py
│   │   ├── detection.py
│   │   ├── incidents.py
│   │   └── alerts.py
│   ├── services/
│   │   ├── detector.py
│   │   ├── video_processor.py
│   │   ├── location.py
│   │   └── notification.py
│   ├── models/
│   │   └── database.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── detection.html
│   │   ├── incidents.html
│   │   └── settings.html
│   └── static/
│       ├── css/
│       └── js/
├── uploads/
├── evidence/
└── tests/
```

### Initial requirements.txt
```text
Flask
Flask-SQLAlchemy
python-dotenv
opencv-python
numpy
Pillow
ultralytics
Werkzeug
```

Add the exact PyTorch/TensorFlow packages required by the selected model.

### Definition of Done
The project is ready for demonstration when:
- A user can open the Flask dashboard.
- A video can be uploaded.
- OpenCV processes frames.
- The trained model detects a probable accident.
- The UI changes to accident state.
- Evidence is captured.
- An incident is stored.
- Location is shown when available.
- An alert is generated/logged.
- Incident history displays the event.
- The system works without IoT hardware.
