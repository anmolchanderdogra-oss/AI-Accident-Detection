# Backend & Database Schema
## AI-Based Accident Detection and Emergency Alert System

### 1. Database Choice
**MVP:** SQLite  
**Production:** PostgreSQL

### 2. Entity Relationship
```text
USERS
  |
  | 1-to-many
  v
INCIDENTS
  |---- 1-to-many ----> ALERTS
  |
  |---- 1-to-many ----> EVIDENCE
  |
  +---- 0..1 ---------> LOCATIONS

EMERGENCY_CONTACTS
  |
  | 1-to-many
  v
ALERTS
```

### 3. users
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| name | VARCHAR | Required |
| email | VARCHAR | Unique |
| password_hash | VARCHAR | Never store plain password |
| role | VARCHAR | admin/operator |
| created_at | TIMESTAMP | Required |

### 4. incidents
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| source_type | VARCHAR | upload/webcam |
| source_name | VARCHAR | Optional |
| detected_at | TIMESTAMP | Required |
| confidence | DECIMAL | 0–1 |
| status | VARCHAR | detected/reviewed/cancelled |
| location_id | FK | Optional |
| created_at | TIMESTAMP | Required |

### 5. evidence
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| incident_id | FK | Required |
| file_type | VARCHAR | image/video |
| file_path | TEXT | Protected storage path |
| captured_at | TIMESTAMP | Required |

### 6. locations
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| latitude | DECIMAL | Required when available |
| longitude | DECIMAL | Required when available |
| accuracy_m | DECIMAL | Optional |
| source | VARCHAR | browser/manual/demo |
| created_at | TIMESTAMP | Required |

### 7. emergency_contacts
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| name | VARCHAR | Required |
| phone | VARCHAR | Optional |
| email | VARCHAR | Optional |
| enabled | BOOLEAN | Default true |
| created_at | TIMESTAMP | Required |

### 8. alerts
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| incident_id | FK | Required |
| contact_id | FK | Required |
| channel | VARCHAR | email/sms/demo |
| status | VARCHAR | pending/sent/failed |
| provider_message_id | VARCHAR | Optional |
| sent_at | TIMESTAMP | Optional |
| error_message | TEXT | Optional |

### 9. settings
| Field | Type | Notes |
|---|---|---|
| id | INTEGER/UUID | PK |
| key | VARCHAR | Unique |
| value | TEXT | Config value |
| updated_at | TIMESTAMP | Required |

Suggested keys:
```text
accident_threshold
required_positive_frames
cooldown_seconds
notification_enabled
location_required
```

### 10. Example SQL
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    accuracy_m DECIMAL(10,2),
    source VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type VARCHAR(30) NOT NULL,
    source_name VARCHAR(255),
    detected_at TIMESTAMP NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    status VARCHAR(30) DEFAULT 'detected',
    location_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_path TEXT NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id)
);

CREATE TABLE emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (incident_id) REFERENCES incidents(id),
    FOREIGN KEY (contact_id) REFERENCES emergency_contacts(id)
);
```

### 11. Map Link
Generate a map URL from coordinates at runtime rather than storing a hard-coded link:
```text
https://www.google.com/maps?q={latitude},{longitude}
```

### 12. Data Retention
For a student/demo project, retain incident evidence locally. For production, define a retention period and delete old evidence securely according to operational/legal requirements.
