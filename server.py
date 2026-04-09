"""
VinFast AI Assistant — FastAPI Server
======================================
REST API backend for the React frontend.
"""

import os
import sys
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is on sys.path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

load_dotenv()

from src.agent.agent import chat, get_agent
from src.core.db_queries import get_all_models, get_car_detail, get_bank_policies

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VinFast AI Assistant — Vifa AI",
    description="API backend cho chatbot tư vấn xe điện VinFast",
    version="1.0.0",
)

# CORS for React dev server
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request/Response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    thread_id: str


class FeedbackRequest(BaseModel):
    thread_id: str
    message_id: Optional[str] = None
    feedback_type: str  # "like" | "dislike"
    reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"name": "VinFast AI Assistant — Vifa AI", "status": "online"}


@app.post("/api/chat", response_model=ChatResponse)
def api_chat(req: ChatRequest):
    """Send a message to the AI agent and get a response."""
    thread_id = req.thread_id or str(uuid.uuid4())

    try:
        response = chat(req.message, thread_id=thread_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    return ChatResponse(response=response, thread_id=thread_id)


@app.get("/api/cars")
def api_list_cars():
    """Get all active car models (for UI display)."""
    return {"cars": get_all_models()}


@app.get("/api/cars/{car_id}")
def api_car_detail(car_id: str):
    """Get detailed info for a specific car model."""
    car = get_car_detail(car_id)
    if not car:
        raise HTTPException(status_code=404, detail=f"Car '{car_id}' not found")
    return {"car": car}


@app.get("/api/banks")
def api_list_banks():
    """Get all bank loan policies."""
    return {"banks": get_bank_policies()}


@app.post("/api/feedback")
def api_feedback(req: FeedbackRequest):
    """Record user feedback (Like/Dislike)."""
    from src.telemetry.logger import logger
    logger.log_event("FEEDBACK", {
        "thread_id": req.thread_id,
        "message_id": req.message_id,
        "feedback_type": req.feedback_type,
        "reason": req.reason,
    })
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("server:app", host=host, port=port, reload=True)
