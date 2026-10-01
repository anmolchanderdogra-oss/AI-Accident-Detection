import sqlite3
import os
from datetime import datetime, timezone
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.EVIDENCE_FOLDER, exist_ok=True)
    os.makedirs(os.path.dirname(Config.MODEL_PATH), exist_ok=True)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Locations table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy_m REAL,
        source TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Incidents table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL,
        source_name TEXT,
        detected_at TIMESTAMP NOT NULL,
        confidence REAL NOT NULL,
        status TEXT DEFAULT 'detected',
        location_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations(id)
    )
    ''')

    # Evidence table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
    )
    ''')

    # Emergency contacts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        enabled BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Alerts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL,
        contact_id INTEGER NOT NULL,
        channel TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        provider_message_id TEXT,
        sent_at TIMESTAMP,
        error_message TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents(id),
        FOREIGN KEY (contact_id) REFERENCES emergency_contacts(id)
    )
    ''')

    # System Settings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Seed default settings if empty
    default_settings = [
        ('accident_threshold', str(Config.ACCIDENT_THRESHOLD)),
        ('required_positive_frames', str(Config.REQUIRED_POSITIVE_FRAMES)),
        ('cooldown_seconds', str(Config.COOLDOWN_SECONDS)),
        ('notification_enabled', 'true'),
        ('location_required', 'false')
    ]
    for key, val in default_settings:
        cursor.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', (key, val))

    # Seed default sample emergency contact if table empty
    cursor.execute('SELECT COUNT(*) FROM emergency_contacts')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO emergency_contacts (name, phone, email, enabled)
        VALUES (?, ?, ?, ?)
        ''', ('Central Emergency Dispatch', '+1-800-555-0199', 'dispatch@city-emergency.org', 1))
        cursor.execute('''
        INSERT INTO emergency_contacts (name, phone, email, enabled)
        VALUES (?, ?, ?, ?)
        ''', ('Highway Patrol Response Unit', '+1-800-555-0122', 'traffic.patrol@state.gov', 1))

    conn.commit()
    conn.close()

# Helper Data Access Functions

def create_location(lat, lon, accuracy=None, source='browser'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO locations (latitude, longitude, accuracy_m, source)
    VALUES (?, ?, ?, ?)
    ''', (lat, lon, accuracy, source))
    loc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return loc_id

def create_incident(source_type, source_name, confidence, detected_at=None, location_id=None):
    if not detected_at:
        detected_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO incidents (source_type, source_name, detected_at, confidence, status, location_id)
    VALUES (?, ?, ?, ?, 'detected', ?)
    ''', (source_type, source_name, detected_at, confidence, location_id))
    incident_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return incident_id

def add_evidence(incident_id, file_path, file_type='image'):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO evidence (incident_id, file_type, file_path)
    VALUES (?, ?, ?)
    ''', (incident_id, file_type, file_path))
    ev_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return ev_id

def get_incidents(limit=50, status=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = '''
    SELECT i.id, i.source_type, i.source_name, i.detected_at, i.confidence, i.status, i.created_at,
           l.latitude, l.longitude, l.source as loc_source,
           (SELECT file_path FROM evidence WHERE incident_id = i.id ORDER BY id ASC LIMIT 1) as evidence_path,
           (SELECT COUNT(*) FROM alerts WHERE incident_id = i.id AND status = 'sent') as alerts_sent
    FROM incidents i
    LEFT JOIN locations l ON i.location_id = l.id
    '''
    params = []
    if status:
        query += ' WHERE i.status = ?'
        params.append(status)
    query += ' ORDER BY i.id DESC LIMIT ?'
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_incident_by_id(incident_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT i.*, l.latitude, l.longitude, l.accuracy_m, l.source as loc_source
    FROM incidents i
    LEFT JOIN locations l ON i.location_id = l.id
    WHERE i.id = ?
    ''', (incident_id,))
    incident = cursor.fetchone()
    if not incident:
        conn.close()
        return None
    res = dict(incident)

    cursor.execute('SELECT * FROM evidence WHERE incident_id = ?', (incident_id,))
    res['evidence'] = [dict(row) for row in cursor.fetchall()]

    cursor.execute('''
    SELECT a.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
    FROM alerts a
    JOIN emergency_contacts c ON a.contact_id = c.id
    WHERE a.incident_id = ?
    ''', (incident_id,))
    res['alerts'] = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return res

def update_incident_status(incident_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE incidents SET status = ? WHERE id = ?', (status, incident_id))
    conn.commit()
    conn.close()

def get_emergency_contacts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM emergency_contacts ORDER BY id ASC')
    contacts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return contacts

def add_emergency_contact(name, phone, email, enabled=1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO emergency_contacts (name, phone, email, enabled)
    VALUES (?, ?, ?, ?)
    ''', (name, phone, email, enabled))
    contact_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return contact_id

def delete_emergency_contact(contact_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM emergency_contacts WHERE id = ?', (contact_id,))
    conn.commit()
    conn.close()

def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM settings')
    settings = {row['key']: row['value'] for row in cursor.fetchall()}
    conn.close()
    return settings

def update_setting(key, value):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    ''', (key, str(value)))
    conn.commit()
    conn.close()
