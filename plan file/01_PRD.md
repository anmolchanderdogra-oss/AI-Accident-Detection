# Product Requirements Document (PRD)
## AI-Based Accident Detection and Emergency Alert System

### 1. Product Overview
A web-based AI safety system that analyzes live or uploaded road video using Computer Vision and Deep Learning to detect probable vehicle accidents. When an accident is detected above a configurable confidence threshold, the system captures evidence, records the event, obtains available location information, and creates an emergency alert for configured contacts.

**Primary stack:** Python, Deep Learning, OpenCV, Flask  
**No IoT hardware is required.**

### 2. Problem Statement
Road accidents can be detected late when nobody immediately reports them. The system aims to reduce the time between an accident occurring and an alert being generated.

### 3. Goals
- Detect probable accidents from video.
- Process live webcam/CCTV-style streams and uploaded videos.
- Show detection confidence and event status in real time.
- Capture an accident frame and optionally a short evidence clip.
- Obtain latitude/longitude through browser location when available.
- Generate a map location link.
- Send or simulate emergency notifications.
- Maintain an accident event history for authorized users.
- Provide a simple Flask dashboard for monitoring.

### 4. Non-Goals
- No accelerometer, ESP32, Arduino, GPS module, or other IoT sensor is required.
- The system must not claim that every detected event is a confirmed accident.
- It is not a replacement for emergency dispatch or professional medical services.
- Automatic hospital/ambulance dispatch is optional and should only be implemented through authorized integrations.

### 5. Target Users
1. **Admin/Operator:** monitors detection and manages emergency contacts.
2. **Vehicle/CCTV Operator:** starts a camera/video stream.
3. **Emergency Contact:** receives an alert containing event details and location.
4. **Demo/Evaluator:** reviews detection, dashboard, evidence, and event history.

### 6. Core Features
#### F1 — Video Input
- Upload MP4/AVI/MOV files.
- Start/stop webcam processing.
- Validate file type and size.
- Show processing status.

#### F2 — AI Accident Detection
- Run a trained/fine-tuned model on video frames.
- Return accident probability/confidence.
- Use a temporal rule such as multiple positive frames before triggering.
- Avoid triggering repeatedly for the same event.

#### F3 — Evidence Capture
On a trigger:
- Save timestamp.
- Save frame image.
- Save confidence score.
- Save source name.
- Save optional short video clip.

#### F4 — Location
Preferred method:
- Browser Geolocation API obtains latitude/longitude with user permission.
Fallback:
- Configured demo location or manually entered coordinates.

#### F5 — Emergency Alert
Alert contains:
- Event ID
- Date/time
- Accident confidence
- Latitude/longitude
- Map link
- Evidence image link
- Contact/notification status

#### F6 — Dashboard
Dashboard cards:
- Detection status
- Current confidence
- Total incidents
- Alerts sent
- Recent incidents
- Camera/video preview

#### F7 — Incident History
- Search/filter events.
- View evidence.
- View location.
- View notification status.
- Mark incident as reviewed.

### 7. User Stories
- As an operator, I want to upload a road video so that the AI can analyze it.
- As an operator, I want to use my webcam so that the system can process a live stream.
- As an admin, I want to configure emergency contacts so alerts can be sent.
- As an operator, I want the system to capture evidence when an accident is detected.
- As an authorized user, I want to see the accident location on a map.
- As an admin, I want to review previous incidents.

### 8. Success Metrics
- Detection pipeline processes video without crashing.
- Accident events produce an incident record.
- Evidence is stored successfully.
- Location is attached when permission/data is available.
- Alert workflow is logged.
- False triggers are reduced using confidence + consecutive-frame logic.

### 9. Acceptance Criteria
- User can upload a supported video.
- Video frames are displayed/processed.
- AI returns a confidence value.
- A configurable threshold controls triggering.
- A trigger creates exactly one incident for an event window.
- Incident includes timestamp and evidence.
- Location is attached when available.
- Dashboard displays the incident.
- Notification result is stored.

### 10. Risks
- Poor lighting, camera angle, occlusion, weather, and unusual collisions can reduce accuracy.
- A dataset that is too small or biased can produce false positives/negatives.
- Browser location requires user permission.
- Notification providers may require API credentials and paid plans.
- This is a decision-support/demo system, not a certified safety-critical system.

### 11. MVP Scope
**Phase 1:** upload video + AI detection + OpenCV + Flask dashboard + evidence storage.  
**Phase 2:** webcam/live stream + browser GPS + incident database.  
**Phase 3:** email/SMS/WhatsApp notification integration + authentication.  
**Phase 4:** model improvement, analytics, deployment and monitoring.
