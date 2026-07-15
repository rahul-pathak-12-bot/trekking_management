from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):

    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)  
    password = db.Column(db.String(200), nullable=False)   
    contact = db.Column(db.String(20))
    role = db.Column(db.String(20), nullable=False, default="trekker")
    active = db.Column(db.Boolean, default=True) 

    bookings = db.relationship("Booking", backref="user", lazy=True)

    assigned_treks = db.relationship("Trek", backref="staff", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "contact": self.contact,
            "role": self.role,
            "active": self.active,
        }

class Trek(db.Model):
    __tablename__ = "trek"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(120), nullable=False)
    difficulty = db.Column(db.String(20))          
    duration = db.Column(db.Integer)               
    total_slots = db.Column(db.Integer, default=0)
    available_slots = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="Pending") 
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    description = db.Column(db.Text)

    assigned_staff_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    bookings = db.relationship("Booking", backref="trek", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "difficulty": self.difficulty,
            "duration": self.duration,
            "total_slots": self.total_slots,
            "available_slots": self.available_slots,
            "status": self.status,
            "start_date": self.start_date.strftime("%Y-%m-%d") if self.start_date else None,
            "end_date": self.end_date.strftime("%Y-%m-%d") if self.end_date else None,
            "description": self.description,
            "assigned_staff_id": self.assigned_staff_id,
            "assigned_staff_name": self.staff.full_name if self.staff else None,
        }


class Booking(db.Model):
    __tablename__ = "booking"

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "trek_id",
            name="unique_user_trek_booking"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    trek_id = db.Column(db.Integer, db.ForeignKey("trek.id"), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="Booked") 

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "trek_id": self.trek_id,
            "trek_name": self.trek.name if self.trek else None,
            "location": self.trek.location if self.trek else None,
            "booking_date": self.booking_date.strftime("%Y-%m-%d") if self.booking_date else None,
            "status": self.status,
        }