"""
VinFast Agent — State Definition
=================================
TypedDict state for the LangGraph agent.
"""

from typing import Annotated, Any, Dict, List, Literal, Optional, TypedDict

from langgraph.graph.message import add_messages


Phase = Literal[
    "GREETING",
    "CAR_DISCOVERY",
    "FINANCE_QUESTION",
    "FINANCE_FULL_PAY",
    "FINANCE_INSTALLMENT",
    "HANDOFF_COLLECT",
    "HANDOFF_DONE",
]

Confidence = Literal["HIGH", "LOW", "FAILURE"]


class VinFastState(TypedDict):
    """State schema for the VinFast AI chatbot graph."""

    # --- Conversation ---
    messages: Annotated[list, add_messages]

    # --- Phase tracking ---
    current_phase: Phase

    # --- Car selection ---
    selected_car_id: Optional[str]
    selected_car_info: Optional[Dict[str, Any]]

    # --- Finance slot-filling ---
    finance_slots: Dict[str, Any]
    # Expected keys: {
    #   "down_payment": float | None,      # ratio 0.0-1.0
    #   "loan_term_months": int | None,     # 12|24|36|48|60|72|84
    #   "interest_rate": float | None,      # % per year
    #   "bank_id": str | None,             # bank code
    # }

    # --- Confidence ---
    confidence: Confidence

    # --- Lead info ---
    customer_name: Optional[str]
    customer_phone: Optional[str]

    # --- Session ---
    session_id: str


def create_initial_state(session_id: str = "default") -> VinFastState:
    """Create a fresh state for a new conversation."""
    return VinFastState(
        messages=[],
        current_phase="GREETING",
        selected_car_id=None,
        selected_car_info=None,
        finance_slots={
            "down_payment": None,
            "loan_term_months": None,
            "interest_rate": None,
            "bank_id": None,
        },
        confidence="HIGH",
        customer_name=None,
        customer_phone=None,
        session_id=session_id,
    )
