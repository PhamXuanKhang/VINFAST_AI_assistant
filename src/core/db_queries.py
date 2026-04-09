"""
VinFast AI Assistant — SQLite Data Access Layer
================================================
Pure functions for querying the VinFast database.
All tools call these functions — no direct SQL in tool code.
"""

import json
import os
import re
import sqlite3
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "vinfast.db")


def _get_conn() -> sqlite3.Connection:
    """Get a connection with row_factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _normalize_model(text: str) -> str:
    """Normalize model name for flexible matching.
    'VF5', 'VF 5', 'vf5', 'Vf-5' → 'vf 5'
    """
    t = text.strip().lower()
    t = re.sub(r"[^a-z0-9\s]", "", t)  # remove special chars
    # Insert space between letters and digits: "vf5" → "vf 5"
    t = re.sub(r"([a-z])(\d)", r"\1 \2", t)
    return t.strip()


# ---------------------------------------------------------------------------
# Car Variants
# ---------------------------------------------------------------------------

def get_cars_by_filters(
    model_series: Optional[str] = None,
    seats: Optional[int] = None,
    budget_max: Optional[int] = None,
    body_style: Optional[str] = None,
    active_only: bool = True,
) -> List[Dict[str, Any]]:
    """Query car variants with optional filters. Returns list of dicts."""
    conn = _get_conn()
    cursor = conn.cursor()

    query = """
        WITH AllVariants AS (
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM Vehicle_Details
            UNION
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM car_variants
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Details)
        ),
        AllPrices AS (
            SELECT car_id, retail_price FROM Vehicle_Price
            UNION
            SELECT car_id, retail_price FROM car_prices
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Price)
        )
        SELECT v.*, p.retail_price
        FROM AllVariants v
        LEFT JOIN AllPrices p ON v.car_id = p.car_id
        WHERE 1=1
    """
    params: list = []

    if active_only:
        query += " AND v.is_active = 1"

    if model_series:
        normalized = _normalize_model(model_series)
        query += " AND (LOWER(v.model_series) LIKE ? OR LOWER(v.model_series || ' ' || v.trim_level) LIKE ? OR LOWER(v.car_id) LIKE ?)"
        params.extend([f"%{normalized}%", f"%{normalized}%", f"%{normalized}%"])

    if seats:
        query += " AND v.seats = ?"
        params.append(seats)

    if budget_max:
        query += " AND p.retail_price <= ?"
        params.append(budget_max)

    if body_style:
        query += " AND LOWER(v.body_style) LIKE ?"
        params.append(f"%{body_style.lower()}%")

    query += " ORDER BY p.retail_price ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        d = dict(row)
        # Parse detailed_specs JSON
        if d.get("detailed_specs"):
            try:
                d["detailed_specs"] = json.loads(d["detailed_specs"])
            except (json.JSONDecodeError, TypeError):
                d["detailed_specs"] = {}
        results.append(d)

    return results


def get_car_detail(car_id: str) -> Optional[Dict[str, Any]]:
    """Get full details for a single car variant."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        WITH AllVariants AS (
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM Vehicle_Details
            UNION
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM car_variants
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Details)
        ),
        AllPrices AS (
            SELECT car_id, retail_price, effective_date FROM Vehicle_Price
            UNION
            SELECT car_id, retail_price, effective_date FROM car_prices
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Price)
        )
        SELECT v.*, p.retail_price, p.effective_date
        FROM AllVariants v
        LEFT JOIN AllPrices p ON v.car_id = p.car_id
        WHERE v.car_id = ?
    """, (car_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    d = dict(row)
    if d.get("detailed_specs"):
        try:
            d["detailed_specs"] = json.loads(d["detailed_specs"])
        except (json.JSONDecodeError, TypeError):
            d["detailed_specs"] = {}
    return d


def get_all_models() -> List[Dict[str, Any]]:
    """Get summary list of all active models (for quick reference)."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        WITH AllVariants AS (
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM Vehicle_Details
            UNION
            SELECT car_id, model_series, trim_level, body_style, seats, range_wltp_km, battery_capacity, drivetrain, is_active, detailed_specs
            FROM car_variants
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Details)
        ),
        AllPrices AS (
            SELECT car_id, retail_price FROM Vehicle_Price
            UNION
            SELECT car_id, retail_price FROM car_prices
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Price)
        )
        SELECT v.car_id, v.model_series, v.trim_level, v.body_style,
               v.seats, v.range_wltp_km, p.retail_price
        FROM AllVariants v
        LEFT JOIN AllPrices p ON v.car_id = p.car_id
        WHERE v.is_active = 1
        ORDER BY p.retail_price ASC
    """)

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Pricing & Fees
# ---------------------------------------------------------------------------

def get_car_price(car_id: str) -> Optional[Dict[str, Any]]:
    """Get pricing info for a specific car."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        WITH AllPrices AS (
            SELECT car_id, retail_price, 0 as deposit_vnd, NULL as promo_note, effective_date FROM Vehicle_Price
            UNION
            SELECT car_id, retail_price, deposit_vnd, promo_note, effective_date FROM car_prices
            WHERE car_id NOT IN (SELECT car_id FROM Vehicle_Price)
        )
        SELECT * FROM AllPrices WHERE car_id = ?
        ORDER BY effective_date DESC LIMIT 1
    """, (car_id,))

    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_location_fees(location_id: str = "HAN") -> Optional[Dict[str, Any]]:
    """Get regional fees for road price calculation."""
    conn = _get_conn()
    cursor = conn.cursor()

    # Normalize: accept 'hanoi', 'ha noi', 'HAN' etc.
    loc_map = {
        "hanoi": "HAN", "ha noi": "HAN", "hà nội": "HAN", "han": "HAN",
        "hcm": "SGN", "hcmc": "SGN", "ho chi minh": "SGN", "hồ chí minh": "SGN",
        "tp.hcm": "SGN", "tp hcm": "SGN", "sgn": "SGN", "saigon": "SGN", "sài gòn": "SGN",
        "tinh": "PROVINCE", "tỉnh": "PROVINCE", "province": "PROVINCE", "khac": "PROVINCE",
    }
    loc_key = loc_map.get(location_id.strip().lower(), location_id.strip().upper())

    cursor.execute("SELECT * FROM location_tax_fee WHERE location_id = ?", (loc_key,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def calculate_on_road_price(car_id: str, location_id: str = "HAN") -> Optional[Dict[str, Any]]:
    """Calculate total on-road price (giá lăn bánh)."""
    price_info = get_car_price(car_id)
    fees_info = get_location_fees(location_id)

    if not price_info or not fees_info:
        return None

    base_price = price_info["retail_price"]
    reg_tax = int(base_price * fees_info["registration_tax_rate"])
    plate = fees_info["plate_fee"]
    inspection = fees_info["inspection_fee"]
    road = fees_info["road_usage_fee"]
    insurance = fees_info["insurance_civil"]

    total_fees = reg_tax + plate + inspection + road + insurance
    total_on_road = base_price + total_fees

    return {
        "car_id": car_id,
        "location": fees_info["location_name"],
        "base_price": base_price,
        "registration_tax": reg_tax,
        "plate_fee": plate,
        "inspection_fee": inspection,
        "road_usage_fee": road,
        "insurance_civil": insurance,
        "total_fees": total_fees,
        "total_on_road": total_on_road,
        "promo_note": None,
    }


# ---------------------------------------------------------------------------
# Bank Loan Policies
# ---------------------------------------------------------------------------

def get_bank_policies(bank_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get loan policies. If bank_id is None, returns all banks."""
    conn = _get_conn()
    cursor = conn.cursor()

    if bank_id:
        cursor.execute("SELECT * FROM bank_loan_policy WHERE bank_id = ?",
                        (bank_id.strip().upper(),))
    else:
        cursor.execute("SELECT * FROM bank_loan_policy ORDER BY interest_rate_year1 ASC")

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Leads
# ---------------------------------------------------------------------------

def save_lead(
    customer_phone: str,
    customer_name: Optional[str] = None,
    session_id: Optional[str] = None,
    selected_car_id: Optional[str] = None,
    finance_summary: Optional[dict] = None,
) -> int:
    """Save a customer lead. Returns the lead ID."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute(
        """INSERT INTO leads (session_id, customer_name, customer_phone,
                              selected_car_id, finance_summary)
           VALUES (?, ?, ?, ?, ?)""",
        (session_id, customer_name, customer_phone,
         selected_car_id, json.dumps(finance_summary) if finance_summary else None),
    )
    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return lead_id

def schedule_appointment(
    lead_id: int,
    customer_name: str,
    phone: str,
    car_model: str,
    finance_type: str,
    showroom_id: str,
    showroom_name: str,
    appointment_datetime: str,
) -> str:
    """Save an appointment. Returns the confirmation code."""
    import uuid
    import random
    import string

    conn = _get_conn()
    cursor = conn.cursor()

    appointment_id = str(uuid.uuid4())
    confirmation_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    cursor.execute(
        """INSERT INTO appointments (appointment_id, lead_id, customer_name, phone, car_model, finance_type, showroom_id, showroom_name, appointment_datetime, confirmation_code)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (appointment_id, lead_id, customer_name, phone, car_model, finance_type, showroom_id, showroom_name, appointment_datetime, confirmation_code),
    )
    conn.commit()
    conn.close()
    return confirmation_code
