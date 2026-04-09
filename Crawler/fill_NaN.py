# fill_missing_specs.py
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = str(Path(__file__).parent / "vinfast.db")

# Dữ liệu đầy đủ theo từng car_id
SPECS_MAP = {
    # VF 3
    "VF3_ECO":      {"range_wltp_km": 210,  "battery_capacity": 19.5},
    "VF3_PLUS":     {"range_wltp_km": 210,  "battery_capacity": 19.5},
    "VF3_STANDARD": {"range_wltp_km": 210,  "battery_capacity": 19.5},
    # VF 5
    "VF5_ECO":      {"range_wltp_km": 326,  "battery_capacity": 37.0},
    "VF5_PLUS":     {"range_wltp_km": 326,  "battery_capacity": 37.0},
    "VF5_STANDARD": {"range_wltp_km": 326,  "battery_capacity": 37.0},
    # VF 6
    "VF6_ECO":      {"range_wltp_km": 399,  "battery_capacity": 59.6},
    "VF6_PLUS":     {"range_wltp_km": 399,  "battery_capacity": 59.6},
    "VF6_STANDARD": {"range_wltp_km": 399,  "battery_capacity": 59.6},
    # VF 7
    "VF7_ECO":      {"range_wltp_km": 431,  "battery_capacity": 75.3},
    "VF7_PLUS":     {"range_wltp_km": 431,  "battery_capacity": 75.3},
    "VF7_STANDARD": {"range_wltp_km": 431,  "battery_capacity": 75.3},
    # VF 8
    "VF8_ECO":      {"range_wltp_km": 420,  "battery_capacity": 82.0},
    "VF8_PLUS":     {"range_wltp_km": 447,  "battery_capacity": 87.7},
    "VF8_STANDARD": {"range_wltp_km": 420,  "battery_capacity": 82.0},
    # VF 9
    "VF9_ECO":      {"range_wltp_km": 560,  "battery_capacity": 111.0},
    "VF9_PLUS":     {"range_wltp_km": 594,  "battery_capacity": 123.0},
    "VF9_STANDARD": {"range_wltp_km": 560,  "battery_capacity": 111.0},
}


def fill_missing_specs():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur  = conn.cursor()
    now  = datetime.now(timezone.utc).isoformat()

    updated = 0
    skipped = 0

    # Lấy tất cả car_id hiện có
    rows = cur.execute("SELECT car_id FROM Vehicle_Details").fetchall()

    for row in rows:
        car_id = row["car_id"]
        specs  = SPECS_MAP.get(car_id)

        if not specs:
            print(f"  ⚠️  Không có spec cho: {car_id}")
            skipped += 1
            continue

        cur.execute("""
            UPDATE Vehicle_Details
            SET range_wltp_km    = ?,
                battery_capacity = ?,
                updated_at       = ?
            WHERE car_id = ?
              AND (range_wltp_km IS NULL OR battery_capacity IS NULL)
        """, (
            specs["range_wltp_km"],
            specs["battery_capacity"],
            now,
            car_id,
        ))

        if cur.rowcount > 0:
            print(f"  ✅ {car_id:<18} range={specs['range_wltp_km']}km  battery={specs['battery_capacity']}kWh")
            updated += 1
        else:
            print(f"  ✔️  {car_id:<18} đã có dữ liệu, bỏ qua")
            skipped += 1

    conn.commit()
    conn.close()
    print(f"\n🎉 Hoàn tất! Updated: {updated} | Skipped: {skipped}")


if __name__ == "__main__":
    fill_missing_specs()