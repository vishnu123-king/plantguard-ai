import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.api.routes import health, diagnosis
from backend.app.database.seed import init_db

app = FastAPI(
    title=settings.APP_NAME,
    description="AI Plant Leaf Disease Detection, Risk Assessment & Treatment System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB tables on startup
@app.on_event("startup")
def on_startup():
    init_db()
    os.makedirs("uploads", exist_ok=True)

# Include Routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(diagnosis.router, prefix="/api", tags=["Diagnosis"])

# Mount uploads static directory
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
