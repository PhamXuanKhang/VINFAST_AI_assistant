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


@app.get("/api/admin/appointments")
def api_admin_appointments():
    """Get all appointments for admin dashboard."""
    from src.core.db_queries import _get_conn
    conn = _get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM appointments ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    return {"appointments": [dict(r) for r in rows]}


@app.get("/api/admin/signals")
def api_admin_signals():
    """Get telemetry signals from logs."""
    import json
    from datetime import datetime
    log_file = os.path.join(ROOT_DIR, "logs", f"{datetime.now().strftime('%Y-%m-%d')}.log")
    logs = []
    if os.path.exists(log_file):
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get("event") in ["FEEDBACK", "HANDOFF", "OUT_OF_SCOPE", "CORRECTION"]:
                        logs.append(data)
                except:
                    pass
    return {"signals": logs[::-1]}

@app.get("/api/admin/metrics")
def api_admin_metrics():
    """Calculate and get overall metrics for admin dashboard."""
    from src.core.db_queries import _get_conn
    conn = _get_conn()
    c = conn.cursor()
    
    # 1. Total leads
    c.execute("SELECT COUNT(*) as count FROM leads")
    total_leads = c.fetchone()["count"]
    
    # 2. Total appointments
    c.execute("SELECT COUNT(*) as count FROM appointments")
    total_appointments = c.fetchone()["count"]
    
    conn.close()
    return {
        "metrics": {
            "total_leads": total_leads,
            "total_appointments": total_appointments,
            "handoff_rate": 0, # could be computed from total sessions vs leads
        }
    }



# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("server:app", host=host, port=port, reload=True)
