from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, jwt, cors
from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.customer_routes import customer_bp
from app.routes.product_routes import product_bp
from app.routes.category_routes import category_bp
from app.routes.inventory_routes import inventory_bp
from app.routes.setting_routes import setting_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({
            'success': False,
            'message': 'Missing or invalid Authorization header. Token is required.'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({
            'success': False,
            'message': 'Invalid JWT token. Signature verification failed.'
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'JWT token has expired. Please log in again.'
        }), 401

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(setting_bp)

    # Root API health check
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'success': True,
            'message': 'TzSuperPOS Backend API is healthy and running',
            'version': '1.0.0'
        }), 200

    return app
