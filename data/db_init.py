"""
VinFast AI Assistant — Database Initialization Script
=====================================================
Creates all tables and seeds reference data for the Vifa AI chatbot.

Usage:
    python data/db_init.py          # Creates/resets vinfast.db
    python data/db_init.py --seed   # Creates + inserts seed data

Tables:
    - car_variants      : Master catalog (specs, flexible JSON column)
    - car_prices        : Pricing per variant (base price, deposit, promos)
    - location_tax_fee  : Regional fees (registration, plate, insurance)
    - bank_loan_policy  : Loan terms per bank
    - leads             : Customer contact info from handoff
    - crawl_logs        : Crawler audit trail (keep existing)
"""

import json
import os
import sqlite3
import sys
from datetime import date

DB_PATH = os.path.join(os.path.dirname(__file__), "vinfast.db")


# ---------------------------------------------------------------------------
# Schema DDL
# ---------------------------------------------------------------------------

SCHEMA_SQL = """
-- Drop old tables (except crawl_logs — keep crawler history)
DROP TABLE IF EXISTS car_variants;
DROP TABLE IF EXISTS car_prices;
DROP TABLE IF EXISTS location_tax_fee;
DROP TABLE IF EXISTS bank_loan_policy;
DROP TABLE IF EXISTS leads;

CREATE TABLE car_variants (
    car_id          TEXT PRIMARY KEY,
    model_series    TEXT NOT NULL,           -- e.g. "VF 5"
    trim_level      TEXT NOT NULL,           -- e.g. "Plus", "Eco"
    body_style      TEXT,                    -- e.g. "SUV hạng A"
    seats           INTEGER,                -- e.g. 5
    range_wltp_km   INTEGER,                -- e.g. 326
    battery_capacity REAL,                  -- kWh
    drivetrain      TEXT,                   -- FWD / RWD / AWD
    is_active       INTEGER DEFAULT 1,
    detailed_specs  TEXT DEFAULT '{}',      -- JSON: flexible crawl data
    image_url       TEXT,                   -- representative image
    source_url      TEXT,
    crawled_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE car_prices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id          TEXT NOT NULL REFERENCES car_variants(car_id),
    retail_price    INTEGER NOT NULL,       -- VND (đã bao gồm pin)
    deposit_vnd     INTEGER DEFAULT 0,      -- tiền đặt cọc
    promo_note      TEXT,                   -- ghi chú khuyến mãi
    effective_date  TEXT NOT NULL,
    source_url      TEXT,
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE location_tax_fee (
    location_id         TEXT PRIMARY KEY,           -- HAN, SGN, PROVINCE
    location_name       TEXT NOT NULL,              -- Hà Nội, TP.HCM, Tỉnh khác
    registration_tax_rate REAL DEFAULT 0.0,         -- xe điện hiện tại 0%
    plate_fee           INTEGER DEFAULT 0,          -- biển số (VND)
    inspection_fee      INTEGER DEFAULT 0,          -- đăng kiểm
    road_usage_fee      INTEGER DEFAULT 0,          -- phí đường bộ
    insurance_civil     INTEGER DEFAULT 0,          -- TNDS bắt buộc
    updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE bank_loan_policy (
    bank_id             TEXT PRIMARY KEY,
    bank_name           TEXT NOT NULL,
    max_loan_percentage REAL DEFAULT 0.80,          -- tỷ lệ vay tối đa
    interest_rate_year1 REAL,                       -- lãi suất ưu đãi năm 1 (%)
    interest_rate_from_year2 REAL,                  -- lãi suất từ năm 2 (%)
    max_term_months     INTEGER DEFAULT 84,
    notes               TEXT,
    updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE leads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT,
    customer_name   TEXT,
    customer_phone  TEXT NOT NULL,
    selected_car_id TEXT,
    finance_summary TEXT,                   -- JSON summary
    created_at      TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_variants_series ON car_variants(model_series);
CREATE INDEX IF NOT EXISTS idx_car_variants_active ON car_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_car_prices_car ON car_prices(car_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(customer_phone);
"""


# ---------------------------------------------------------------------------
# Seed Data
# ---------------------------------------------------------------------------

CAR_VARIANTS_SEED = [
    {
        "car_id": "VF3_ECO",
        "model_series": "VF 3",
        "trim_level": "Eco",
        "body_style": "Mini SUV",
        "seats": 4,
        "range_wltp_km": 210,
        "battery_capacity": 18.64,
        "drivetrain": "FWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/v0f6c9f8b0fe5d1fb08c98f4e36a2b9e9e28e7ea/VF3/vf3-eco.png",
        "source_url": "https://vinfastauto.com/vn_vi/xe-dien-vf-3",
        "detailed_specs": json.dumps({
            "motor_power_kw": 30,
            "torque_nm": 110,
            "top_speed_kmh": 120,
            "charge_dc_0_70_min": 36,
            "screen_inch": 7.0,
            "has_adas": False,
            "has_carplay": False,
            "trunk_liters": 110,
        }),
    },
    {
        "car_id": "VF5_PLUS",
        "model_series": "VF 5",
        "trim_level": "Plus",
        "body_style": "SUV hạng A",
        "seats": 5,
        "range_wltp_km": 326,
        "battery_capacity": 37.23,
        "drivetrain": "FWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/VF5/vf5-plus.png",
        "source_url": "https://vinfastauto.com/vn_vi/tong-quan-xe-o-to-dien-vinfast-vf-5-plus",
        "detailed_specs": json.dumps({
            "motor_power_kw": 100,
            "torque_nm": 135,
            "top_speed_kmh": 150,
            "charge_dc_0_70_min": 30,
            "screen_inch": 7.0,
            "wheel_inch": 17,
            "has_adas": True,
            "has_sunroof": False,
            "has_carplay": False,
            "trunk_liters": 230,
        }),
    },
    {
        "car_id": "VF6_PLUS",
        "model_series": "VF 6",
        "trim_level": "Plus",
        "body_style": "SUV hạng B",
        "seats": 5,
        "range_wltp_km": 399,
        "battery_capacity": 59.6,
        "drivetrain": "FWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/VF6/vf6-plus.png",
        "source_url": "https://vinfastauto.com/vn_vi/thong-so-vf-6-moi-nhat",
        "detailed_specs": json.dumps({
            "motor_power_kw": 150,
            "torque_nm": 250,
            "top_speed_kmh": 150,
            "charge_dc_0_70_min": 24,
            "screen_inch": 12.9,
            "has_adas": True,
            "has_sunroof": False,
            "has_360_camera": False,
            "trunk_liters": 422,
        }),
    },
    {
        "car_id": "VF7_PLUS",
        "model_series": "VF 7",
        "trim_level": "Plus",
        "body_style": "SUV hạng C",
        "seats": 5,
        "range_wltp_km": 431,
        "battery_capacity": 75.3,
        "drivetrain": "FWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/VF7/vf7-plus.png",
        "source_url": "https://vinfastauto.com/vn_vi/xe-dien-vf-7",
        "detailed_specs": json.dumps({
            "motor_power_kw": 174,
            "torque_nm": 350,
            "top_speed_kmh": 170,
            "charge_dc_0_70_min": 24,
            "screen_inch": 12.9,
            "has_adas": True,
            "has_sunroof": True,
            "has_360_camera": True,
            "has_heated_seat": False,
            "trunk_liters": 457,
        }),
    },
    {
        "car_id": "VF8_PLUS",
        "model_series": "VF 8",
        "trim_level": "Plus",
        "body_style": "D-SUV",
        "seats": 5,
        "range_wltp_km": 471,
        "battery_capacity": 87.7,
        "drivetrain": "AWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/VF8/vf8-plus.png",
        "source_url": "https://vinfastauto.com/vn_vi/xe-dien-vf-8",
        "detailed_specs": json.dumps({
            "motor_power_kw": 300,
            "torque_nm": 620,
            "top_speed_kmh": 200,
            "charge_dc_0_70_min": 26,
            "screen_inch": 15.6,
            "has_adas": True,
            "has_sunroof": True,
            "has_360_camera": True,
            "has_heated_seat": True,
            "trunk_liters": 508,
        }),
    },
    {
        "car_id": "VF9_PLUS",
        "model_series": "VF 9",
        "trim_level": "Plus",
        "body_style": "E-SUV",
        "seats": 7,
        "range_wltp_km": 438,
        "battery_capacity": 92.0,
        "drivetrain": "AWD",
        "image_url": "https://shop.vinfastauto.com/on/demandware.static/-/Sites-vinfast_vn-Library/default/VF9/vf9-plus.png",
        "source_url": "https://vinfastauto.com/vn_vi/xe-dien-vf-9",
        "detailed_specs": json.dumps({
            "motor_power_kw": 300,
            "torque_nm": 620,
            "top_speed_kmh": 200,
            "charge_dc_0_70_min": 26,
            "screen_inch": 15.6,
            "has_adas": True,
            "has_sunroof": True,
            "has_360_camera": True,
            "has_heated_seat": True,
            "has_3rd_row": True,
            "trunk_liters": 658,
        }),
    },
]

CAR_PRICES_SEED = [
    # Giá niêm yết tham khảo (VND, đã bao gồm pin)
    {"car_id": "VF3_ECO",  "retail_price": 322_000_000,   "deposit_vnd": 15_000_000, "promo_note": "Ưu đãi đặt cọc sớm", "effective_date": "2025-01-01"},
    {"car_id": "VF5_PLUS", "retail_price": 548_000_000,   "deposit_vnd": 20_000_000, "promo_note": None, "effective_date": "2025-01-01"},
    {"car_id": "VF6_PLUS", "retail_price": 765_000_000,   "deposit_vnd": 30_000_000, "promo_note": "Hỗ trợ phí trước bạ", "effective_date": "2025-01-01"},
    {"car_id": "VF7_PLUS", "retail_price": 999_000_000,   "deposit_vnd": 50_000_000, "promo_note": None, "effective_date": "2025-01-01"},
    {"car_id": "VF8_PLUS", "retail_price": 1_359_000_000, "deposit_vnd": 50_000_000, "promo_note": "Tặng gói bảo dưỡng 2 năm", "effective_date": "2025-01-01"},
    {"car_id": "VF9_PLUS", "retail_price": 1_570_000_000, "deposit_vnd": 100_000_000, "promo_note": "Tặng gói bảo dưỡng 3 năm", "effective_date": "2025-01-01"},
]

LOCATION_TAX_FEES_SEED = [
    # Xe điện hiện tại: lệ phí trước bạ 0%
    {"location_id": "HAN",      "location_name": "Hà Nội",      "registration_tax_rate": 0.0, "plate_fee": 20_000_000, "inspection_fee": 340_000, "road_usage_fee": 1_560_000, "insurance_civil": 530_700},
    {"location_id": "SGN",      "location_name": "TP. Hồ Chí Minh", "registration_tax_rate": 0.0, "plate_fee": 20_000_000, "inspection_fee": 340_000, "road_usage_fee": 1_560_000, "insurance_civil": 530_700},
    {"location_id": "PROVINCE", "location_name": "Tỉnh khác",   "registration_tax_rate": 0.0, "plate_fee": 1_000_000,  "inspection_fee": 340_000, "road_usage_fee": 1_560_000, "insurance_civil": 530_700},
]

BANK_LOAN_POLICIES_SEED = [
    {"bank_id": "VINFAST", "bank_name": "VinFast Finance (mặc định)", "max_loan_percentage": 0.80, "interest_rate_year1": 8.0,  "interest_rate_from_year2": 11.0, "max_term_months": 84, "notes": "Lãi suất ưu đãi năm đầu"},
    {"bank_id": "VCB",     "bank_name": "Vietcombank",                "max_loan_percentage": 0.70, "interest_rate_year1": 7.5,  "interest_rate_from_year2": 10.5, "max_term_months": 84, "notes": None},
    {"bank_id": "BIDV",    "bank_name": "BIDV",                       "max_loan_percentage": 0.80, "interest_rate_year1": 7.8,  "interest_rate_from_year2": 10.8, "max_term_months": 96, "notes": None},
    {"bank_id": "TCB",     "bank_name": "Techcombank",                "max_loan_percentage": 0.75, "interest_rate_year1": 8.5,  "interest_rate_from_year2": 11.5, "max_term_months": 72, "notes": "Duyệt nhanh 24h"},
    {"bank_id": "VPB",     "bank_name": "VPBank",                     "max_loan_percentage": 0.80, "interest_rate_year1": 8.2,  "interest_rate_from_year2": 11.2, "max_term_months": 84, "notes": None},
]


# ---------------------------------------------------------------------------
# Init logic
# ---------------------------------------------------------------------------

def init_db(db_path: str = DB_PATH, seed: bool = True) -> None:
    """Create schema and optionally seed data."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create schema
    cursor.executescript(SCHEMA_SQL)
    print(f"[OK] Schema created in {db_path}")

    if seed:
        _seed_car_variants(cursor)
        _seed_car_prices(cursor)
        _seed_location_fees(cursor)
        _seed_bank_policies(cursor)
        conn.commit()
        print(f"[OK] Seed data inserted")

    # Verify
    for table in ["car_variants", "car_prices", "location_tax_fee", "bank_loan_policy", "leads"]:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} rows")

    conn.close()
    print("[DONE] Database initialized successfully.")


def _seed_car_variants(cursor: sqlite3.Cursor) -> None:
    for v in CAR_VARIANTS_SEED:
        cursor.execute(
            """INSERT INTO car_variants
               (car_id, model_series, trim_level, body_style, seats, range_wltp_km,
                battery_capacity, drivetrain, detailed_specs, image_url, source_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (v["car_id"], v["model_series"], v["trim_level"], v["body_style"],
             v["seats"], v["range_wltp_km"], v["battery_capacity"], v["drivetrain"],
             v["detailed_specs"], v.get("image_url"), v.get("source_url")),
        )


def _seed_car_prices(cursor: sqlite3.Cursor) -> None:
    for p in CAR_PRICES_SEED:
        cursor.execute(
            """INSERT INTO car_prices
               (car_id, retail_price, deposit_vnd, promo_note, effective_date)
               VALUES (?, ?, ?, ?, ?)""",
            (p["car_id"], p["retail_price"], p["deposit_vnd"],
             p["promo_note"], p["effective_date"]),
        )


def _seed_location_fees(cursor: sqlite3.Cursor) -> None:
    for lf in LOCATION_TAX_FEES_SEED:
        cursor.execute(
            """INSERT INTO location_tax_fee
               (location_id, location_name, registration_tax_rate, plate_fee,
                inspection_fee, road_usage_fee, insurance_civil)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (lf["location_id"], lf["location_name"], lf["registration_tax_rate"],
             lf["plate_fee"], lf["inspection_fee"], lf["road_usage_fee"],
             lf["insurance_civil"]),
        )


def _seed_bank_policies(cursor: sqlite3.Cursor) -> None:
    for bp in BANK_LOAN_POLICIES_SEED:
        cursor.execute(
            """INSERT INTO bank_loan_policy
               (bank_id, bank_name, max_loan_percentage, interest_rate_year1,
                interest_rate_from_year2, max_term_months, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (bp["bank_id"], bp["bank_name"], bp["max_loan_percentage"],
             bp["interest_rate_year1"], bp["interest_rate_from_year2"],
             bp["max_term_months"], bp.get("notes")),
        )


if __name__ == "__main__":
    do_seed = "--seed" in sys.argv or len(sys.argv) == 1  # seed by default
    init_db(seed=do_seed)
