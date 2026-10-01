# Application Flow
## AI-Based Accident Detection and Emergency Alert System

### 1. Main Navigation
```text
Login (optional for MVP)
      |
      v
Dashboard
 ├── Live Detection
 ├── Upload Video
 ├── Incidents
 ├── Emergency Contacts
 └── Settings
```

### 2. Dashboard Flow
```text
Dashboard
   |
   +--> AI Status: Ready / Processing / Accident Detected
   |
   +--> Current Video Preview
   |
   +--> Confidence Meter
   |
   +--> Recent Incidents
   |
   +--> Alert Status
```

### 3. Upload Video Flow
```text
Upload Video
     |
Validate file
     |
Start processing
     |
Extract frames with OpenCV
     |
AI inference
     |
Confidence aggregation
     |
Accident?
  /       \
No        Yes
 |         |
Continue  Capture frame
           |
       Save incident
           |
      Get location
           |
      Create alert
           |
       Show alert
```

### 4. Live Camera Flow
```text
Start Camera
     |
Browser asks camera permission
     |
OpenCV receives frames
     |
AI inference
     |
Temporal trigger logic
     |
Accident detected
     |
Freeze/display evidence
     |
Countdown / operator review (recommended)
     |
Send alert
```

### 5. Emergency Alert Flow
```text
Accident Detected
      |
Create Incident ID
      |
Capture Evidence
      |
Get Location
      |
Build Message
      |
Send Notification
   /           \
Success       Failure
  |              |
Log sent       Log failure
  |              |
Show status    Retry option
```

### 6. Incident Detail Flow
```text
Incidents
   |
Select Incident
   |
+--------------------------+
| Time                     |
| Confidence               |
| Evidence                 |
| Latitude / Longitude     |
| Map                      |
| Alert Status             |
| Reviewed / Unreviewed    |
+--------------------------+
```

### 7. Recommended Screens
1. Login (optional)
2. Dashboard
3. Live Detection
4. Upload & Analysis
5. Accident Alert Modal
6. Incident Details
7. Incident History
8. Emergency Contacts
9. Settings
10. System Health

### 8. Alert UX
When detection crosses the trigger rule:
- Show a prominent accident state.
- Display confidence.
- Display captured evidence.
- Display location availability.
- Provide **Send Alert** / **Cancel** for demo/operator-controlled mode.
- For fully automatic mode, log the alert immediately and show the result.

### 9. Empty/Error States
Examples:
- “No incidents recorded yet.”
- “Camera permission is required for live detection.”
- “Location unavailable. Add location manually.”
- “Notification failed. Retry.”
- “No model found. Check MODEL_PATH.”

### 10. Important Safety UX
Use wording such as:
- “Probable accident detected”
- “AI confidence: 91%”
instead of:
- “Confirmed accident”

This avoids presenting an AI prediction as absolute certainty.
