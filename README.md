# Trek It - Trekking Management System

A Application developed using **Flask**, **Vue.js**, **SQLite**, **Redis**, and **Celery** for managing trekking events, staff, and trek bookings.

---

## Project Overview

Trek It is a Trekking Management System that allows administrators to manage trekking events, staff members, and trekkers. Staff members can manage assigned treks and participants, while trekkers can browse available treks, make bookings, cancel bookings, update their profiles, and export booking history.

This project has been developed as part of the Modern Application Development course.

---

## Technologies Used

### Backend

- Python 3
- Flask
- SQLAlchemy
- SQLite
- JWT Authentication
- Redis
- Celery

### Frontend

- Vue.js 3
- Vue Router
- Bootstrap 5
- Bootstrap Icons

### Database

- SQLite

---

## Features

### Admin

- Secure Login
- Dashboard with statistics
- Create, Update and Delete Treks
- Assign Staff to Treks
- Add Staff Members
- Activate/Blacklist Users and Staff
- Search Treks, Staff, Users and Bookings

### Staff

- View Assigned Treks
- Update Trek Status
- Manage Available Slots
- View Participants
- Mark Trek as Completed

### Trekker

- Register/Login
- Browse Available Treks
- Search and Filter Treks
- Book Treks
- Cancel Bookings
- View Booking History
- Update Profile
- Export Booking History (CSV)

### Background Jobs

- Daily Email Reminder
- Monthly Activity Report
- Asynchronous CSV Export

### Performance

- Redis Caching for Open Treks
- Automatic Cache Refresh

---

## Project Structure

```
backend/
│
├── jobs/
│   ├── exports.py
│   ├── reminders.py
│   └── reports.py
│
├── routes/
│   ├── admin_routes.py
│   ├── auth_routes.py
│   ├── staff_routes.py
│   └── user_routes.py
│
├── app.py
├── auth.py
├── cache.py
├── celery_app.py
├── mailer.py
├── models.py
├── tasks.py
│
frontend/
│
├── css/
│   └── style.css
├── app.js
└── index.html
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Trek-It
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

Activate:

Windows

```bash
venv\Scripts\activate
```

Linux/Mac

```bash
source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
SECRET_KEY=your_secret_key

MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

ADMIN_EMAIL=admin@tma.com

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

### 5. Start Redis

```bash
redis-server
```

---

### 6. Run Flask Backend

```bash
cd backend
python app.py
```

Server:

```
http://localhost:5000
```

---

### 7. Start Celery Worker

Open another terminal:

```bash
cd backend
celery -A celery_app.celery worker --pool=solo --loglevel=info
```

---

### 8. Start Celery Beat

```bash
cd backend
celery -A celery_app.celery beat --loglevel=info
```

---

### 9. Open Frontend

Open:

```
frontend/index.html
```

or serve it using Live Server.

---

## Default Admin Login

Email

```
admin@tma.com
```

Password

```
admin123
```

---

## API Authentication

All protected APIs require JWT authentication.

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Database

SQLite database is automatically created on first run.

Default database:

```
tma.db
```

---

## Background Jobs

### Daily Reminder

Sends reminder emails to trekkers whose trek starts the next day.

### Monthly Report

Generates monthly statistics and emails the report to the administrator.

### CSV Export

Exports trek booking history asynchronously and sends it through email.

---

## Cache

Redis is used for caching frequently accessed trek data.

Cache is automatically refreshed whenever:

- Trek is created
- Trek is updated
- Trek is deleted
- Booking is created
- Booking is cancelled

---
