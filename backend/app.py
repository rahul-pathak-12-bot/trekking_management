from flask import Flask, jsonify
from flask_cors import CORS
from models import db, User
from auth import hash_password

from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.staff_routes import staff_bp
from routes.user_routes import user_bp

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = "change-this-secret-key-in-production"   
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tma.db"    
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(user_bp)

    @app.route("/")
    def home():
        return jsonify({"message": "Trekking Management API is running"})
    return app


def seed_admin():
    admin = User.query.filter_by(role="admin").first()
    if not admin:
        admin = User(
            full_name="Administrator",
            email="admin@tma.com",
            password=hash_password("admin123"),
            role="admin",
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin created email: admin@tma.com  password: admin123")
    else:
        print("Admin already exists.")

app = create_app()
with app.app_context():
    db.create_all() 
    seed_admin()

if __name__ == "__main__":
    app.run(debug=True, port=5000)