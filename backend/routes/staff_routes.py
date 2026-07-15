from flask import Blueprint, request, jsonify
from models import db, Trek, Booking
from auth import token_required
from cache import cache

staff_bp = Blueprint("staff", __name__)

def _owns_trek(staff_user, trek):
    return trek.assigned_staff_id == staff_user.id


@staff_bp.route("/api/staff/dashboard", methods=["GET"])
@token_required(["staff"])
def dashboard(current_user):
    my_treks = Trek.query.filter_by(assigned_staff_id=current_user.id).all()
    total_participants = sum(len(t.bookings) for t in my_treks)
    open_treks = sum(1 for t in my_treks if t.status == "Open")
    return jsonify({
        "assigned_treks": len(my_treks),
        "total_participants": total_participants,
        "open_treks": open_treks,
        "treks": [t.to_dict() for t in my_treks],
    })

@staff_bp.route("/api/staff/treks", methods=["GET"])
@token_required(["staff"])
def my_treks(current_user):
    treks = Trek.query.filter_by(assigned_staff_id=current_user.id).all()
    return jsonify([t.to_dict() for t in treks])

@staff_bp.route("/api/staff/treks/<int:trek_id>", methods=["PUT"])
@token_required(["staff"])
def update_trek(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    if not _owns_trek(current_user, trek):
        return jsonify({"message": "This trek is not assigned to you"}), 403

    data = request.get_json()

    if "available_slots" in data:
        new_available = int(data["available_slots"])

        if new_available < 0:
            return jsonify({
            "message": "Available slots cannot be negative"
        }), 400

        booked = trek.total_slots - trek.available_slots

        if new_available + booked > trek.total_slots:
            return jsonify({
            "message": "Available slots exceed total capacity"
        }), 400

        trek.available_slots = new_available

    if "status" in data:
        trek.status = data["status"]

    db.session.commit()
    cache.delete("open_treks")

    return jsonify({
        "message": "Trek updated",
        "trek": trek.to_dict()
})


@staff_bp.route("/api/staff/treks/<int:trek_id>/participants", methods=["GET"])
@token_required(["staff"])
def participants(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    if not _owns_trek(current_user, trek):
        return jsonify({"message": "This trek is not assigned to you"}), 403
    return jsonify([b.to_dict() for b in trek.bookings])


@staff_bp.route("/api/staff/treks/<int:trek_id>/mark", methods=["PUT"])
@token_required(["staff"])
def mark_trek(current_user, trek_id):
    trek = Trek.query.get_or_404(trek_id)
    if not _owns_trek(current_user, trek):
        return jsonify({"message": "This trek is not assigned to you"}), 403

    data = request.get_json()
    new_status = data.get("status")  
    trek.status = new_status

    if new_status == "Completed":
        for b in trek.bookings:
            if b.status == "Booked":
                b.status = "Completed"

    db.session.commit()
    cache.delete("open_treks")
    return jsonify({"message": f"Trek marked {new_status}", "trek": trek.to_dict()})