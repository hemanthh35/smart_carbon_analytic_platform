"""FastAPI application entry point."""
from __future__ import annotations

import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import init_db
from app.routers import auth, users, admin, prediction, carbon_credit, reports, dashboard, analytics
from app.utils.logger import get_logger

logger = get_logger("app")

# ─── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])

# ─── App Instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "🌿 **Smart Carbon Credit Analytics Platform** — "
        "AI-powered emission prediction, carbon credit computation, "
        "PDF report generation, and analytics dashboards."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ─── Rate Limiting Middleware ──────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Security Headers Middleware ───────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ─── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} [{duration:.1f}ms]")
    return response


# ─── Static Files ─────────────────────────────────────────────────────────────
os.makedirs(settings.reports_dir, exist_ok=True)
os.makedirs(settings.uploads_dir, exist_ok=True)
os.makedirs(settings.logs_dir, exist_ok=True)
os.makedirs("app/static", exist_ok=True)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ─── Startup: DB init + Model load ────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing database tables…")
    init_db()
    logger.info("Loading BiLSTM model and scaler…")
    from app.ai.inference import inference_engine
    inference_engine.load(
        model_path=settings.model_path,
        scaler_path=settings.scaler_path,
    )
    logger.info("Loading Climate TRACE dataset...")
    from app.services.dataset_service import dataset_service
    dataset_service.initialize()
    logger.info("🚀 Application startup complete.")


# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(prediction.router)
app.include_router(carbon_credit.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    from app.ai.inference import inference_engine
    return {
        "status": "healthy",
        "version": settings.app_version,
        "model_loaded": inference_engine.is_loaded,
    }


# ─── Global Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )
