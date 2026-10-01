import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'accident-guard-ai-secret-key-2026')
    DATABASE_PATH = os.path.join(BASE_DIR, 'accidents.db')
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMPLATES_AUTO_RELOAD = True
    SEND_FILE_MAX_AGE_DEFAULT = 0

    # File storage paths
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    EVIDENCE_FOLDER = os.path.join(BASE_DIR, 'evidence')
    ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
    MAX_CONTENT_LENGTH = 120 * 1024 * 1024  # 120 MB max upload

    # AI Detection & Temporal Logic Defaults
    ACCIDENT_THRESHOLD = float(os.environ.get('ACCIDENT_THRESHOLD', 0.65))
    REQUIRED_POSITIVE_FRAMES = int(os.environ.get('REQUIRED_FRAMES', 2))
    COOLDOWN_SECONDS = int(os.environ.get('COOLDOWN_SECONDS', 30))

    # Model configuration - auto-detects best.pt in root or model/ directory
    _default_model = os.path.join(BASE_DIR, 'best.pt') if os.path.exists(os.path.join(BASE_DIR, 'best.pt')) else (
        os.path.join(BASE_DIR, 'model', 'best.pt') if os.path.exists(os.path.join(BASE_DIR, 'model', 'best.pt')) else
        os.path.join(BASE_DIR, 'model', 'accident_model.pt')
    )
    MODEL_PATH = os.environ.get('MODEL_PATH', _default_model)

    # Notification & SMTP settings (Optional real integration)
    SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USER = os.environ.get('SMTP_USER', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    ALERT_EMAIL_FROM = os.environ.get('ALERT_EMAIL_FROM', 'alerts@accidentguard.ai')
