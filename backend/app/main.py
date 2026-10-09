"""FastAPI application entry point."""
from __future__ import annotations

import asyncio
from contextlib import suppress
import os
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
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

# Keep the platform health check responsive while TensorFlow and the dataset
# are loading during a cold start.
app.state.startup_ready = False
app.state.startup_error = None
app.state.startup_task = None

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
def _initialize_application_dependencies() -> None:
    """Perform blocking initialization outside the event-loop thread."""
    logger.info("Initializing database tables...")
    init_db()

    logger.info("Loading BiLSTM model and scaler...")
    from app.ai.inference import inference_engine
    inference_engine.load(
        model_path=settings.model_path,
        scaler_path=settings.scaler_path,
    )

    logger.info("Loading Climate TRACE dataset...")
    from app.services.dataset_service import dataset_service
    dataset_service.initialize()


async def _initialize_application() -> None:
    """Load the model and dataset without delaying the health endpoint."""
    try:
        await asyncio.to_thread(_initialize_application_dependencies)
    except Exception as exc:
        app.state.startup_error = str(exc)
        logger.exception("Application initialization failed: %s", exc)
        return

    app.state.startup_ready = True
    logger.info("Application startup complete.")


@app.on_event("startup")
async def startup_event():
    app.state.startup_task = asyncio.create_task(_initialize_application())
    logger.info("HTTP server ready; model and dataset loading in background.")


@app.on_event("shutdown")
async def shutdown_event():
    task = app.state.startup_task
    if task and not task.done():
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(prediction.router)
app.include_router(carbon_credit.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)


# ---------------------------------------------------------------------------
# Monolith frontend serving
# ---------------------------------------------------------------------------
# In production the React build is copied next to the backend and FastAPI
# serves it from the same origin. This keeps browser routes working on refresh
# while all API routes remain under /api/*.
# ─── Health Check ─────────────────────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health"])
async def health_check():
    from app.ai.inference import inference_engine

    if app.state.startup_error:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "ready": False,
                "error": "Application initialization failed",
                "model_loaded": inference_engine.is_loaded,
            },
        )

    return {
        "status": "healthy" if app.state.startup_ready else "starting",
        "ready": app.state.startup_ready,
        "version": settings.app_version,
        "model_loaded": inference_engine.is_loaded,
    }


@app.head("/", include_in_schema=False)
async def root_head_check():
    """Accept platform/prober HEAD checks against the site root."""
    return Response(status_code=200)


# ─── Global Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Monolith frontend serving (registered after API and health routes)
# ---------------------------------------------------------------------------
# In production the React build is copied next to the backend and FastAPI
# serves it from the same origin. This keeps browser routes working on refresh
# while all API routes remain under /api/*.
frontend_dist = Path(os.getenv(
    "FRONTEND_DIST_DIR",
    str(Path(__file__).resolve().parents[2] / "frontend" / "dist"),
)).resolve()

if frontend_dist.is_dir():
    frontend_assets = frontend_dist / "assets"
    if frontend_assets.is_dir():
        app.mount("/assets", StaticFiles(directory=frontend_assets), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        requested_path = (frontend_dist / full_path).resolve()
        if frontend_dist not in requested_path.parents and requested_path != frontend_dist:
            raise HTTPException(status_code=404, detail="Not found")
        if requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(frontend_dist / "index.html")
