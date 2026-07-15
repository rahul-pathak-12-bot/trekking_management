from flask import Blueprint, request, jsonify
from models import db, User, Trek, Booking
from auth import token_required, hash_password
from cache import cache
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

# DASHBOARD
@admin_bp.route("/api/admin/dashboard", methods=["GET"])
@token_required(["admin"])
def dashboard(current_user):
    return jsonify({
        "total_treks": Trek.query.count(),
        "total_users": User.query.filter_by(role="trekker").count(),
        "total_staff": User.query.filter_by(role="staff").count(),
        "total_bookings": Booking.query.count(),
        
        "recent_bookings": [b.to_dict() for b in
                            Booking.query.order_by(Booking.id.desc()).limit(5).all()],
    })


# TREK MANAGEMENT
@admin_bp.route("/api/admin/treks", methods=["POST"])
@token_required(["admin"])
def create_trek(current_user):
    data = request.get_json()
    if not data.get("name") or not data.get("location"):
        return jsonify({"message": "Trek name and location are required"}), 400

    slots = int(data.get("total_slots", 0))

    start_date = None
    end_date = None

    if data.get("start_date"):
        start_date = datetime.strptime(
        data["start_date"],
        "%Y-%m-%d"
    ).date()

    if data.get("end_date"):
        end_date = datetime.strptime(
        data["end_date"],
        "%Y-%m-%d"
    ).date()

    if start_date and end_date and end_date < start_date:
        return jsonify({
        "message": "End date cannot be before start date"
    }), 400

    if slots < 0:
       return jsonify({"message": "Total slots cannot be negative"}), 400
    staff_id = data.get("assigned_staff_id")
    if staff_id:
        staff = User.query.filter_by( id=staff_id, role="staff", active=True).first()
        if not staff:   
            return jsonify({
        "message": "Invalid staff selected"
    }), 400


    trek = Trek(
        name=data["name"],
        location=data["location"],
        difficulty=data.get("difficulty", "Easy"),
        duration=data.get("duration"),
        total_slots=slots,
        available_slots=slots,
        status=data.get("status", "Pending"),
        start_date=start_date,
        end_date=end_date,
        description=data.get("description"),
        assigned_staff_id=staff_id,
    )
    db.session.add(trek)
    db.session.commit()
    cache.delete("open_treks")  
    return jsonify({"message": "Trek created", "trek": trek.to_dict()}), 201


@admin_bp.route("/api/admin/treks/<int:trek_id>", methods=["PUT"])
@token_required(["admin"])
def update_trek(current_user, trek_id):
    """Edit an existing trek."""
    trek = Trek.query.get_or_404(trek_id)
    data = request.get_json()

    trek.name = data.get("name", trek.name)
    trek.location = data.get("location", trek.location)
    trek.difficulty = data.get("difficulty", trek.difficulty)
    trek.duration = data.get("duration", trek.duration)
    trek.status = data.get("status", trek.status)
    if "start_date" in data:
        trek.start_date = datetime.strptime(
        data["start_date"],
        "%Y-%m-%d"
    ).date()

    if "end_date" in data:
        trek.end_date = datetime.strptime(
        data["end_date"],
        "%Y-%m-%d"
    ).date()

    if trek.start_date and trek.end_date and trek.end_date < trek.start_date:
        return jsonify({
        "message": "End date cannot be before start date"
    }), 400
    trek.description = data.get("description", trek.description)
    if "assigned_staff_id" in data:
        staff_id = data.get("assigned_staff_id")
        if staff_id:
            staff = User.query.filter_by( id=staff_id, role="staff", active=True ).first()
            if not staff:
                return jsonify({
                "message": "Invalid staff selected"
            }), 400

        trek.assigned_staff_id = staff_id

    if "total_slots" in data:
        new_total = int(data["total_slots"])
        if new_total < 0:
            return jsonify({
            "message": "Total slots cannot be negative"
        }), 400

        booked = trek.total_slots - trek.available_slots
        trek.total_slots = new_total
        trek.available_slots = max(new_total - booked, 0)

    db.session.commit()
    cache.delete("open_treks")
    return jsonify({"message": "Trek updated", "trek": trek.to_dict()})


@admin_bp.route("/api/admin/treks/<int:trek_id>", methods=["DELETE"])
@token_required(["admin"])
def delete_trek(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    Booking.query.filter_by(trek_id=trek_id).delete() 
    db.session.delete(trek)
    db.session.commit()
    cache.delete("open_treks")
    return jsonify({"message": "Trek deleted"})


@admin_bp.route("/api/admin/treks", methods=["GET"])
@token_required(["admin"])
def list_treks(current_user):
    search = request.args.get("search", "").strip()
    query = Trek.query
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Trek.name.ilike(like), Trek.location.ilike(like)))
    treks = query.order_by(Trek.id).all()
    return jsonify([t.to_dict() for t in treks])


# STAFF MANAGEMENT
@admin_bp.route("/api/admin/staff", methods=["POST"])
@token_required(["admin"])
def add_staff(current_user):
    data = request.get_json()
    if not data.get("full_name") or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Name, email and password are required"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    staff = User(
        full_name=data["full_name"],
        email=data["email"],
        password=hash_password(data["password"]),
        contact=data.get("contact"),
        role="staff",
    )
    db.session.add(staff)
    db.session.commit()
    return jsonify({"message": "Staff added", "staff": staff.to_dict()}), 201


@admin_bp.route("/api/admin/staff", methods=["GET"])
@token_required(["admin"])
def list_staff(current_user):

    search = request.args.get("search", "").strip()
    query = User.query.filter_by(role="staff")

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                User.full_name.ilike(like),
                User.email.ilike(like)
            )
        )
    staff = query.order_by(User.id).all()
    result = []
    for s in staff:
        data = s.to_dict()
        data["trek_count"] = len(s.assigned_treks)
        result.append(data)
    return jsonify(result)

@admin_bp.route("/api/admin/staff/<int:staff_id>/toggle", methods=["PUT"])
@token_required(["admin"])
def toggle_staff(current_user, staff_id):

    staff = User.query.filter_by(
        id=staff_id,
        role="staff"
    ).first_or_404()

    staff.active = not staff.active

    db.session.commit()

    state = "activated" if staff.active else "blacklisted"

    return jsonify({
        "message": f"Staff {state}",
        "staff": staff.to_dict()
    })

@admin_bp.route("/api/admin/treks/<int:trek_id>/assign", methods=["PUT"])
@token_required(["admin"])
def assign_staff(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    data = request.get_json()
    staff_id = data.get("staff_id")

    staff = User.query.filter_by(
    id=staff_id,
    role="staff",
    active=True
).first()

    if not staff:
       return jsonify({
        "message": "Invalid staff selected"
    }), 400

    trek.assigned_staff_id = staff_id
    db.session.commit()
    return jsonify({"message": "Staff assigned", "trek": trek.to_dict()})


# USER MANAGEMENT
@admin_bp.route("/api/admin/users", methods=["GET"])
@token_required(["admin"])
def list_users(current_user):
  
    search = request.args.get("search", "").strip()
    query = User.query.filter_by(role="trekker")
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(User.full_name.ilike(like), User.email.ilike(like)))
    return jsonify([u.to_dict() for u in query.all()])


@admin_bp.route("/api/admin/users/<int:user_id>/toggle", methods=["PUT"])
@token_required(["admin"])
def toggle_user(current_user, user_id):
  
    user = User.query.get_or_404(user_id)
    if user.role == "admin":
        return jsonify({"message": "Cannot deactivate the admin"}), 400
    user.active = not user.active
    db.session.commit()
    state = "activated" if user.active else "deactivated"
    return jsonify({"message": f"User {state}", "user": user.to_dict()})


# BOOKINGS & STATS 
@admin_bp.route("/api/admin/bookings", methods=["GET"])
@token_required(["admin"])
def all_bookings(current_user):

    search = request.args.get("search", "").strip()
    query = Booking.query.join(User).join(Trek)
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                User.full_name.ilike(like),
                Trek.name.ilike(like)
            )
        )
    bookings = query.order_by(Booking.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings])

@admin_bp.route("/api/admin/stats", methods=["GET"])
@token_required(["admin"])
def stats(current_user):
    treks = Trek.query.all()
    popular = sorted(
        [{"name": t.name, "bookings": len(t.bookings)} for t in treks],
        key=lambda x: x["bookings"], reverse=True
    )[:5]
    return jsonify({"popular_treks": popular})