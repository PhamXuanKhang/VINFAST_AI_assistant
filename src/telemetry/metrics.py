import time
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from src.telemetry.logger import logger

class PerformanceTracker:
    """
    Tracking industry-standard metrics for LLMs + VinFast-specific signals.
    """
    def __init__(self):
        self.session_metrics = []
        self.signal_events = []
        self._signal_log_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
            "logs", 
            "signals.jsonl"
        )
        # Ensure logs directory exists
        os.makedirs(os.path.dirname(self._signal_log_path), exist_ok=True)

    def track_request(self, provider: str, model: str, usage: Dict[str, int], latency_ms: int):
        """
        Logs a single request metric to our telemetry.
        """
        metric = {
            "provider": provider,
            "model": model,
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "latency_ms": latency_ms,
            "cost_estimate": self._calculate_cost(model, usage)
        }
        self.session_metrics.append(metric)
        logger.log_event("LLM_METRIC", metric)

    def track_signal(self, signal_type: str, session_id: str, phase: str, details: Optional[Dict[str, Any]] = None):
        """
        Track VinFast-specific implicit signals as per AGENTS.md Section 5.
        
        Signal types:
        - HANDOFF: Session ended with handoff
        - SESSION_LENGTH: Time from GREETING to HANDOFF or page leave
        - RE_ASK: User asks about same topic again in one session
        - SLOT_CORRECTION: Tool called again after user correction
        - APPOINTMENT_RATE: Handoff选择了 đặt lịch vs chờ gọi lại
        """
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "signal_type": signal_type,
            "session_id": session_id,
            "phase": phase,
            "details": details or {},
        }
        self.signal_events.append(event)
        
        # Log to JSONL file for persistence
        try:
            with open(self._signal_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.log_event("SIGNAL_LOG_ERROR", {"error": str(e), "event": event})
        
        # Also log through standard logger for immediate visibility
        logger.log_event(f"VINFAST_SIGNAL.{signal_type}", event)

    def track_handoff(self, session_id: str, phase: str, handoff_type: str = "SALE_HANDOFF"):
        """Track when session ends with handoff to sales."""
        self.track_signal("HANDOFF", session_id, phase, {"handoff_type": handoff_type})

    def track_session_length(self, session_id: str, duration_seconds: float, exit_phase: str):
        """Track session duration from GREETING to HANDOFF or leave."""
        self.track_signal("SESSION_LENGTH", session_id, exit_phase, {
            "duration_seconds": round(duration_seconds, 2)
        })

    def track_re_ask(self, session_id: str, phase: str, topic: str):
        """Track when user asks about same topic again."""
        self.track_signal("RE_ASK", session_id, phase, {"topic": topic})

    def track_slot_correction(self, session_id: str, phase: str, slot_name: str, old_value: Any, new_value: Any):
        """Track when user corrects a slot value."""
        self.track_signal("SLOT_CORRECTION", session_id, phase, {
            "slot_name": slot_name,
            "old_value": old_value,
            "new_value": new_value,
        })

    def track_appointment_rate(self, session_id: str, appointment_chosen: bool):
        """Track when user chooses appointment vs waiting for call."""
        self.track_signal("APPOINTMENT_RATE", session_id, "HANDOFF_COLLECT", {
            "appointment_chosen": appointment_chosen
        })

    def _calculate_cost(self, model: str, usage: Dict[str, int]) -> float:
        """
        TODO: Implement real pricing logic.
        For now, returns a dummy constant.
        """
        return (usage.get("total_tokens", 0) / 1000) * 0.01

    def get_session_summary(self) -> Dict[str, Any]:
        """Get aggregated session statistics."""
        total_signals = len(self.signal_events)
        signal_counts = {}
        for event in self.signal_events:
            sig_type = event["signal_type"]
            signal_counts[sig_type] = signal_counts.get(sig_type, 0) + 1
        
        return {
            "total_llm_requests": len(self.session_metrics),
            "total_signals": total_signals,
            "signal_breakdown": signal_counts,
            "avg_latency_ms": sum(m["latency_ms"] for m in self.session_metrics) / max(len(self.session_metrics), 1),
        }

# Global tracker instance
tracker = PerformanceTracker()
