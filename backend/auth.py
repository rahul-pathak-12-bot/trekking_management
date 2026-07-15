import jwt                      
from functools import wraps    
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import User

def hash_password(plain_password):
    return generate_password_hash(plain_password)

def verify_password(stored_hash, plain_password):
    return check_password_hash(stored_hash, plain_password)

def create_token(user):
    payload = {"user_id": user.id, "role": user.role}
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")
    return token

def token_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")

            if not auth_header.startswith("Bearer "):
                return jsonify({"message": "Token is missing"}), 401
            token = auth_header.split(" ")[1]

            try:
                data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            except Exception:
                return jsonify({"message": "Token is invalid"}), 401

            user = User.query.get(data["user_id"])
            if not user:
                return jsonify({"message": "User not found"}), 401
            if not user.active:
                return jsonify({"message": "Account is deactivated"}), 403

            if allowed_roles and user.role not in allowed_roles:
                return jsonify({"message": "You do not have permission for this action"}), 403

            return f(user, *args, **kwargs)
        return wrapper
    return decorator