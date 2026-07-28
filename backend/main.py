# backend/main.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, projects, agents

app = FastAPI(title="AgentIQ API")

# ✅ Add your Vercel URL here after deployment
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://*.vercel.app",          # all vercel preview URLs
    os.getenv("FRONTEND_URL", ""),   # set this in Render env vars
]

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ALLOWED_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(auth.router,     prefix="/api/auth")
app.include_router(projects.router, prefix="/api/projects")
app.include_router(agents.router,   prefix="/api/agents")

@app.get("/")
def root():
    return {
        "message": "AgentIQ API is running.",
        "status":  "healthy"
    }