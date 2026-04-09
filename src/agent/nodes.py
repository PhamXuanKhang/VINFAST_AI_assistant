"""
VinFast Agent — Graph Nodes
============================
Each function is a node in the LangGraph StateGraph.
"""

import json
from typing import Any, Dict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from src.agent.state import VinFastState
from src.agent.prompts import (
    SYSTEM_PROMPT,
    GREETING_PROMPT,
    CAR_DISCOVERY_PROMPT,
    FINANCE_QUESTION_PROMPT,
    FINANCE_FULL_PAY_PROMPT,
    INSTALLMENT_SLOT_FILLING_PROMPT,
    HANDOFF_PROMPT,
    GUARDRAIL_PROMPT,
)


# ---------------------------------------------------------------------------
# Router Node — Determines which phase to enter
# ---------------------------------------------------------------------------

def router_node(state: VinFastState) -> Dict[str, Any]:
    """Classify user intent and determine the appropriate phase.

    This runs BEFORE the LLM — it's a rule-based classifier
    that sets the phase based on conversation context.
    """
    messages = state.get("messages", [])
    current_phase = state.get("current_phase", "GREETING")

    if not messages:
        return {"current_phase": "GREETING"}

    # Get the last user message
    last_msg = None
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_msg = msg.content.lower()
            break

    if not last_msg:
        return {"current_phase": current_phase}

    # --- Out-of-scope detection (rule-based) ---
    out_of_scope_keywords = [
        "tesla", "toyota", "hyundai", "honda", "mazda", "bmw", "mercedes",
        "kia", "ford", "chevrolet", "nissan", "so sánh với", "hãng khác",
    ]
    if any(kw in last_msg for kw in out_of_scope_keywords):
        return {"current_phase": "GUARDRAIL", "confidence": "LOW"}

    # --- Handoff signals ---
    handoff_keywords = ["liên hệ", "tư vấn viên", "đặt cọc", "lái thử",
                        "gọi lại", "số điện thoại", "sđt"]
    if any(kw in last_msg for kw in handoff_keywords):
        return {"current_phase": "HANDOFF_COLLECT"}

    # --- Finance signals ---
    finance_keywords = ["trả góp", "vay", "ngân hàng", "lãi suất",
                        "trả trước", "mua thẳng", "giá lăn bánh", "phí"]
    if any(kw in last_msg for kw in finance_keywords):
        if state.get("selected_car_id"):
            # Already has a car — determine finance sub-phase
            if "trả góp" in last_msg or "vay" in last_msg:
                return {"current_phase": "FINANCE_INSTALLMENT"}
            elif "mua thẳng" in last_msg:
                return {"current_phase": "FINANCE_FULL_PAY"}
            else:
                return {"current_phase": "FINANCE_QUESTION"}
        else:
            # Need to find car first
            return {"current_phase": "CAR_DISCOVERY"}

    # --- Car selection signal ---
    select_keywords = ["chọn xe này", "xe này đi", "lấy xe này", "ổn", "được rồi", "ok"]
    if any(kw in last_msg for kw in select_keywords) and current_phase == "CAR_DISCOVERY":
        return {"current_phase": "FINANCE_QUESTION"}

    # --- Default: stay in car discovery if past greeting ---
    if current_phase == "GREETING":
        return {"current_phase": "CAR_DISCOVERY"}

    return {"current_phase": current_phase}


# ---------------------------------------------------------------------------
# Phase-specific nodes — Each builds the appropriate prompt
# ---------------------------------------------------------------------------

def greeting_node(state: VinFastState) -> Dict[str, Any]:
    """Generate greeting message on first interaction."""
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + GREETING_PROMPT)],
        "current_phase": "GREETING",
    }


def car_discovery_node(state: VinFastState) -> Dict[str, Any]:
    """Set up context for car discovery."""
    selected = state.get("selected_car_id", "chưa chọn")
    prompt = CAR_DISCOVERY_PROMPT.format(selected_car=selected)
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + prompt)],
    }


def finance_question_node(state: VinFastState) -> Dict[str, Any]:
    """Ask about payment method."""
    car_id = state.get("selected_car_id", "N/A")
    prompt = FINANCE_QUESTION_PROMPT.format(selected_car=car_id)
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + prompt)],
    }


def finance_full_pay_node(state: VinFastState) -> Dict[str, Any]:
    """Handle full payment flow."""
    car_id = state.get("selected_car_id", "N/A")
    prompt = FINANCE_FULL_PAY_PROMPT.format(selected_car=car_id)
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + prompt)],
    }


def installment_node(state: VinFastState) -> Dict[str, Any]:
    """Handle installment slot-filling flow."""
    car_id = state.get("selected_car_id", "N/A")
    slots = state.get("finance_slots", {})

    # Build slot status display
    slot_lines = []
    for key, label in [
        ("down_payment", "Tỷ lệ trả trước"),
        ("loan_term_months", "Kỳ hạn vay"),
        ("interest_rate", "Lãi suất"),
    ]:
        val = slots.get(key)
        status = f"✅ {val}" if val is not None else "❌ chưa có"
        slot_lines.append(f"  - {label}: {status}")

    slot_status = "\n".join(slot_lines)

    prompt = INSTALLMENT_SLOT_FILLING_PROMPT.format(
        selected_car=car_id,
        slot_down_payment=slots.get("down_payment", "chưa có"),
        slot_loan_term=slots.get("loan_term_months", "chưa có"),
        slot_interest_rate=slots.get("interest_rate", "chưa có"),
        slot_status=slot_status,
    )
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + prompt)],
    }


def handoff_node(state: VinFastState) -> Dict[str, Any]:
    """Handle customer info collection for handoff."""
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + HANDOFF_PROMPT)],
        "current_phase": "HANDOFF_COLLECT",
    }


def guardrail_node(state: VinFastState) -> Dict[str, Any]:
    """Handle out-of-scope queries."""
    return {
        "messages": [SystemMessage(content=SYSTEM_PROMPT + "\n\n" + GUARDRAIL_PROMPT)],
    }


# ---------------------------------------------------------------------------
# Post-processing node — Extract state updates from AI response
# ---------------------------------------------------------------------------

def extract_state_updates(state: VinFastState) -> Dict[str, Any]:
    """Parse AI response to extract car selection, slot fills, etc.

    This runs AFTER the LLM response to update state fields
    based on what the AI said/did.
    """
    messages = state.get("messages", [])
    updates: Dict[str, Any] = {}

    # Find the last AI message
    last_ai = None
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            last_ai = msg
            break

    if not last_ai:
        return updates

    content = last_ai.content.lower() if last_ai.content else ""

    # Check if AI called tools and extract results
    if hasattr(last_ai, "tool_calls") and last_ai.tool_calls:
        for tc in last_ai.tool_calls:
            tool_name = tc.get("name", "")
            args = tc.get("args", {})

            if tool_name == "get_car_info":
                # If a specific model was queried, track it
                if args.get("model"):
                    pass  # Will be set when user confirms

            elif tool_name == "save_lead":
                updates["current_phase"] = "HANDOFF_DONE"
                if args.get("customer_name"):
                    updates["customer_name"] = args["customer_name"]
                if args.get("customer_phone"):
                    updates["customer_phone"] = args["customer_phone"]

    # Detect car selection from AI response text
    if state.get("current_phase") == "CAR_DISCOVERY":
        car_ids = ["VF3_ECO", "VF5_PLUS", "VF6_PLUS", "VF7_PLUS", "VF8_PLUS", "VF9_PLUS"]
        for cid in car_ids:
            if cid.lower() in content:
                updates["selected_car_id"] = cid
                break

    return updates
