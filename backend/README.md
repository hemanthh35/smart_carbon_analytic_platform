# 🌿 Smart Carbon Credit Analytics Platform — Backend

Production-ready FastAPI backend with AI-powered emission prediction, carbon credit analytics, JWT authentication, RBAC, and PDF report generation.

---

## 🚀 Quick Start

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, middleware, routers, startup
│   ├── core/
│   │   ├── config.py            # Pydantic Settings from .env
│   │   ├── database.py          # SQLAlchemy engine, session, Base
│   │   ├── security.py          # bcrypt hashing, token blacklist
│   │   ├── jwt_handler.py       # JWT create/decode (access + refresh)
│   │   ├── auth.py              # get_current_user, get_admin_user deps
│   │   └── dependencies.py      # Re-exports
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── prediction.py
│   │   ├── carbon_credit.py
│   │   ├── report.py
│   │   └── audit_log.py
│   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── prediction.py
│   │   ├── carbon_credit.py
│   │   └── report.py
│   ├── routers/                 # API route handlers
│   │   ├── auth.py              # /api/auth/*
│   │   ├── users.py             # /api/users/*
│   │   ├── admin.py             # /api/admin/* (user management)
│   │   ├── prediction.py        # /api/predict, /api/predict/full
│   │   ├── carbon_credit.py     # /api/carbon-credit
│   │   ├── reports.py           # /api/reports/*
│   │   ├── dashboard.py         # /api/dashboard/*
│   │   └── analytics.py        # /api/admin/* (analytics)
│   ├── services/               # Business logic layer
│   │   ├── prediction_service.py
│   │   ├── carbon_credit_service.py
│   │   ├── analytics_service.py
│   │   ├── pdf_service.py       # ReportLab PDF generation
│   │   └── report_service.py
│   ├── ai/
│   │   ├── best_bilstm.keras    # Trained BiLSTM model
│   │   ├── scaler.pkl           # MinMaxScaler
│   │   └── inference.py         # Singleton inference engine
│   └── utils/
│       ├── constants.py         # Roles, actions, feature columns
│       ├── helpers.py           # Pagination, IP, formatting utils
│       └── logger.py            # Rotating file + console logger
├── reports/                     # Generated PDF reports
├── logs/                        # Application logs
├── alembic/                     # Database migration scripts
├── .env                         # Environment configuration
└── requirements.txt
```

---

## 🔐 Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login, receive access + refresh tokens |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout (blacklist token) |

**Token Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

---

## 🤖 AI Prediction

| Endpoint | Method | Description |
|---|---|---|
| `/api/predict` | POST | Simplified 5-field prediction |
| `/api/predict/full` | POST | Full 24-feature prediction |

**Simple Request:**
```json
{
  "activity": 10000,
  "capacity": 300000,
  "capacity_factor": 0.65,
  "lat": 24.3,
  "lon": 54.4
}
```

**Response:**
```json
{
  "id": 1,
  "predicted_emission": 20241.83,
  ...
}
```

> The BiLSTM model was trained on iron & steel facility data. Predictions are in t CO₂. The model target was log1p-transformed during training, so inference applies `np.expm1()` to convert back.

---

## 🌱 Carbon Credits

```
POST /api/carbon-credit
{
  "prediction_id": 1,
  "baseline_emission": 200000
}
```

**Formula:** `reduction = baseline - predicted; credits = max(0, reduction)`

---

## 📊 Dashboard APIs

| Endpoint | Description |
|---|---|
| `GET /api/dashboard/overview` | Total users, predictions, emissions, credits |
| `GET /api/dashboard/emissions-trend` | Monthly emissions trend data |
| `GET /api/dashboard/credit-trend` | Monthly credit trend data |
| `GET /api/dashboard/countries` | Per-country analytics |

---

## 👑 Admin APIs

| Endpoint | Description |
|---|---|
| `GET /api/admin/users` | List all users |
| `DELETE /api/admin/users/{id}` | Delete a user |
| `GET /api/admin/user-growth` | User growth over time |
| `GET /api/admin/prediction-stats` | Prediction statistics |
| `GET /api/admin/top-countries` | Top emitting countries |
| `GET /api/admin/top-facilities` | Top emitting facilities |
| `GET /api/admin/model-metrics` | AI model usage metrics |
| `GET /api/admin/report-stats` | Report generation stats |

---

## 📄 PDF Reports

```
POST /api/reports/generate
{"prediction_id": 1, "report_type": "facility"}
```

Returns `pdf_url` for download. PDFs saved in `reports/` directory.

---

## ⚙️ Configuration (.env)

```env
SECRET_KEY=your-super-secret-key
DATABASE_URL=sqlite:///./backend.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT=100/minute
```

---

## 🛡️ Security Features

- ✅ bcrypt password hashing
- ✅ JWT access + refresh tokens
- ✅ Token blacklist (logout)
- ✅ RBAC (admin/user roles)
- ✅ CORS with configurable origins
- ✅ Security headers (X-Frame-Options, X-XSS-Protection, HSTS)
- ✅ Rate limiting (100 requests/minute by default)
- ✅ Audit logging (all user actions with IP)
- ✅ Pydantic v2 input validation on all endpoints
