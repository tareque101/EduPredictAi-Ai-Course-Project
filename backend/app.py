from flask import Flask, jsonify
from flask_cors import CORS

from auth import bp as auth_bp
from config import Config
from extensions import db
from habits import bp as habits_bp
from ml_api import bp as ml_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(habits_bp)
    app.register_blueprint(ml_bp)

    with app.app_context():
        db.create_all()

    @app.errorhandler(404)
    def not_found(_):
        return jsonify(error="Endpoint not found."), 404

    @app.errorhandler(500)
    def server_error(_):
        return jsonify(error="Internal server error."), 500

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000, debug=True)