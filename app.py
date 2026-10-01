import os
from flask import Flask
from config import Config
from models.database import init_db

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)
    app.jinja_env.auto_reload = True

    # Initialize database & storage folders
    init_db()

    # Register blueprints
    from routes.dashboard import dashboard_bp
    from routes.detection import detection_bp
    from routes.incidents import incidents_bp
    from routes.alerts import alerts_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(detection_bp)
    app.register_blueprint(incidents_bp)
    app.register_blueprint(alerts_bp)

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS,PATCH'
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"===============================================================")
    print(f"  AI-Based Accident Detection & Emergency Alert System")
    print(f"  Dashboard available at: http://127.0.0.1:{port}")
    print(f"===============================================================")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
