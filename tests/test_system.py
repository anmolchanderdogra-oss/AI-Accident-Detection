import os
import sys
import unittest
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from config import Config
from models.database import (
    init_db, get_db_connection, create_location, create_incident,
    add_evidence, get_incidents, get_incident_by_id, get_emergency_contacts,
    get_settings, update_setting
)
from services.detector import AccidentDetector
from services.notification import dispatch_incident_alert

class AccidentDetectionSystemTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_01_db_initialization(self):
        init_db()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()

        expected = ['locations', 'incidents', 'evidence', 'emergency_contacts', 'alerts', 'settings']
        for table in expected:
            self.assertIn(table, tables, f"Table '{table}' should exist in DB")

    def test_02_incident_lifecycle(self):
        loc_id = create_location(37.7749, -122.4194, accuracy=5.0, source='test_browser')
        self.assertIsNotNone(loc_id)

        inc_id = create_incident(
            source_type='test_upload',
            source_name='sample_crash.mp4',
            confidence=0.88,
            location_id=loc_id
        )
        self.assertIsNotNone(inc_id)

        ev_id = add_evidence(inc_id, 'test_frame_01.jpg', file_type='image')
        self.assertIsNotNone(ev_id)

        inc = get_incident_by_id(inc_id)
        self.assertEqual(inc['id'], inc_id)
        self.assertEqual(inc['confidence'], 0.88)
        self.assertEqual(inc['latitude'], 37.7749)
        self.assertEqual(len(inc['evidence']), 1)

    def test_03_alert_dispatch(self):
        # Create an incident to alert
        loc_id = create_location(40.7128, -74.0060, source='test_loc')
        inc_id = create_incident('test', 'test_stream', 0.92, location_id=loc_id)

        result = dispatch_incident_alert(inc_id)
        self.assertIn('dispatched_count', result)
        self.assertGreater(result['dispatched_count'], 0)

        # Check incident alerts recorded
        inc = get_incident_by_id(inc_id)
        self.assertGreater(len(inc['alerts']), 0)
        self.assertEqual(inc['alerts'][0]['status'], 'sent')

    def test_04_temporal_trigger_logic(self):
        detector = AccidentDetector()
        detector.reset_state()
        update_setting('accident_threshold', '0.70')
        update_setting('required_positive_frames', '3')
        update_setting('cooldown_seconds', '5')

        # Frame 1: High confidence (should NOT trigger yet, count=1)
        trig1, count1, _ = detector.update_temporal_trigger(0.85, current_time=100.0)
        self.assertFalse(trig1)
        self.assertEqual(count1, 1)

        # Frame 2: Low confidence (count drops to 0)
        trig2, count2, _ = detector.update_temporal_trigger(0.40, current_time=100.1)
        self.assertFalse(trig2)
        self.assertEqual(count2, 0)

        # Frame 3, 4, 5: 3 consecutive high confidence frames
        trig3, count3, _ = detector.update_temporal_trigger(0.88, current_time=100.2)
        self.assertFalse(trig3)
        self.assertEqual(count3, 1)

        trig4, count4, _ = detector.update_temporal_trigger(0.91, current_time=100.3)
        self.assertFalse(trig4)
        self.assertEqual(count4, 2)

        trig5, count5, _ = detector.update_temporal_trigger(0.95, current_time=100.4)
        self.assertTrue(trig5, "Should trigger on 3rd consecutive positive frame")

        # Frame 6: Within cooldown (should NOT trigger again)
        trig6, _, cd = detector.update_temporal_trigger(0.95, current_time=102.0)
        self.assertFalse(trig6, "Cooldown must block duplicate trigger")
        self.assertGreater(cd, 0)

    def test_05_api_endpoints(self):
        # Health check
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'ONLINE')

        # Detector status
        res2 = self.client.get('/api/detect/status')
        self.assertEqual(res2.status_code, 200)

        # Incidents list
        res3 = self.client.get('/api/incidents')
        self.assertEqual(res3.status_code, 200)

        # Contacts list
        res4 = self.client.get('/api/contacts')
        self.assertEqual(res4.status_code, 200)

    def test_06_incident_clear_endpoint(self):
        # Create a test incident
        create_incident('test_clear', 'test_stream', 0.85)

        # Clear incidents
        res = self.client.post('/api/incidents/clear')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')

        # Verify incidents list is now empty
        res_list = self.client.get('/api/incidents')
        data_list = res_list.get_json()
        self.assertEqual(len(data_list['incidents']), 0)

if __name__ == '__main__':
    unittest.main()

