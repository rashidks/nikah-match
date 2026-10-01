# Nikah Match – Muslim matrimonial site (React + Django)

## Backend (Django REST + JWT)
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser                  # optional, for /admin/
python manage.py runserver                        # http://127.0.0.1:8000

## Frontend (React + Vite)
cd frontend
npm install
npm run dev                                       # http://localhost:5173
(API address is set in frontend/.env as VITE_API_URL)

## API
POST /api/auth/register/   POST /api/auth/login/
GET/PATCH /api/me/         GET /api/profiles/?sect=&prayer=&city=&min_age=&max_age=
GET /api/profiles/<id>/    GET/POST /api/interests/   PATCH /api/interests/<id>/
