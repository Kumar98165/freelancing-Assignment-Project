from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User

def role_required(allowed_roles):
    """
    Decorator to restrict route access to specific roles.
    Example: @role_required(['ADMIN', 'CASHIER'])
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            raw_id = get_jwt_identity()
            try:
                user_id = int(raw_id)
            except (ValueError, TypeError):
                user_id = raw_id
                
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({
                    'success': False, 
                    'message': 'Session expired or user account not found. Please log in again.'
                }), 401
            
            if user.status != 'Active':
                return jsonify({
                    'success': False, 
                    'message': 'Account is inactive. Contact Administrator.'
                }), 403
                
            if user.role not in allowed_roles:
                return jsonify({
                    'success': False, 
                    'message': f'Access forbidden: Requires one of roles [{", ".join(allowed_roles)}]'
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required():
    return role_required(['ADMIN'])
