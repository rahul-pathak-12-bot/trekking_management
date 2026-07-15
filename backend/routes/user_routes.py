from flask import Blueprint, request, jsonify
from models import db, User, Trek, Booking
from auth import token_required, hash_password
from cache import cache

user_bp = Blueprint("user", __name__)

@user_bp.route("/api/treks", methods=["GET"])
@token_required(["trekker"])
def browse_treks(current_user):
    search = request.args.get("search", "").strip()
    difficulty = request.args.get("difficulty", "").strip()
    location = request.args.get("location", "").strip()
    max_duration = request.args.get("max_duration", "").strip()

    no_filters = not any([search, difficulty, location, max_duration])
    if no_filters:
        cached = cache.get("open_treks")
        if cached is not None:
            return jsonify(cached)

    query = Trek.query.filter_by(status="Open")
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Trek.name.ilike(like), Trek.location.ilike(like)))
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if location:
        query = query.filter(Trek.location.ilike(f"%{location}%"))
    if max_duration:
        query = query.filter(Trek.duration <= int(max_duration))

    result = [t.to_dict() for t in query.all()]

    if no_filters:
        cache.set("open_treks", result, ttl=60)  
    return jsonify(result)


@user_bp.route("/api/treks/<int:trek_id>", methods=["GET"])
@token_required(["trekker"])
def trek_details(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    return jsonify(trek.to_dict())


@user_bp.route("/api/treks/<int:trek_id>/book", methods=["POST"])
@token_required(["trekker"])
def book_trek(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)

    if trek.status != "Open":
        return jsonify({"message": "This trek is not open for booking"}), 400

    if trek.available_slots <= 0:
        return jsonify({"message": "No slots available"}), 400

    existing = Booking.query.filter_by(
        user_id=current_user.id, trek_id=trek_id, status="Booked"
    ).first()
    if existing:
        return jsonify({"message": "You have already booked this trek"}), 400

    booking = Booking(user_id=current_user.id, trek_id=trek_id, status="Booked")
    trek.available_slots -= 1           
    db.session.add(booking)
    db.session.commit()
    cache.delete("open_treks")          
    return jsonify({"message": "Trek booked successfully", "booking": booking.to_dict()}), 201


@user_bp.route("/api/my-bookings", methods=["GET"])
@token_required(["trekker"])
def my_bookings(current_user):
    bookings = Booking.query.filter_by(user_id=current_user.id)\
        .order_by(Booking.id.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


@user_bp.route("/api/bookings/<int:booking_id>/cancel", methods=["PUT"])
@token_required(["trekker"])
def cancel_booking(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return jsonify({"message": "Not your booking"}), 403
    if booking.status != "Booked":
        return jsonify({"message": "Only active bookings can be cancelled"}), 400

    booking.status = "Cancelled"
    booking.trek.available_slots += 1   
    db.session.commit()
    cache.delete("open_treks")
    return jsonify({"message": "Booking cancelled"})


@user_bp.route("/api/profile", methods=["PUT"])
@token_required(["trekker"])
def update_profile(current_user):
    data = request.get_json()
    current_user.full_name = data.get("full_name", current_user.full_name)
    current_user.contact = data.get("contact", current_user.contact)
    if data.get("password"):
        current_user.password = hash_password(data["password"])
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": current_user.to_dict()})


@user_bp.route("/api/export-history", methods=["GET"])
@token_required(["trekker"])
def export_history(current_user):
    from tasks import export_booking_history_task

    export_booking_history_task.delay(current_user.id)

    return jsonify({
        "message":
        "Export started. You will receive an email once it is ready."
    })