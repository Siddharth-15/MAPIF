# backend/main.py

import sys
import os
sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, projects, agents

app = FastAPI(title="MAPIF API")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://mapif.vercel.app",
    "https://mapif-git-main-vsg4.vercel.app",
    "https://mapif-ktx0ensgp-vsg4.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url and frontend_url not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ALLOWED_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers     = ["*"],
)

app.include_router(auth.router,     prefix="/api/auth")
app.include_router(projects.router, prefix="/api/projects")
app.include_router(agents.router,   prefix="/api/agents")

@app.get("/")
def root():
    return {
        "message": "MAPIF API is running.",
        "status":  "healthy"
    }

@app.get("/ping")
def ping():
    return {"ping": "pong"}