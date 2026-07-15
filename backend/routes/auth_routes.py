from flask import Blueprint, request, jsonify
from models import db, User
from auth import hash_password, verify_password, create_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data.get("full_name") or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Name, email and password are required"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already registered"}), 400

    new_user = User(
        full_name=data["full_name"],
        email=data["email"],
        password=hash_password(data["password"]),   
        contact=data.get("contact"),
        role="trekker",                         
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful. Please log in."}), 201


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get("email")).first()

    if not user or not verify_password(user.password, data.get("password", "")):
        return jsonify({"message": "Invalid email or password"}), 401

    if not user.active:
        return jsonify({"message": "Your account has been deactivated"}), 403

    token = create_token(user)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),   
    })