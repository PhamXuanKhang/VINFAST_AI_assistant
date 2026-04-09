# crawlers/vinfastauto_crawler.py
import asyncio
import sqlite3
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright

DB_PATH = str(Path(__file__).parent / "vinfast.db")  # luôn cùng thư mục với file .py

VINFAST_AUTO_URLS = {
    "VF 3": ["https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf3.html"],
    "VF 5": [
        "https://vinfastauto.com/vn_vi/tong-quan-xe-o-to-dien-vinfast-vf-5-plus",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf5.html",
    ],
    "VF 6": [
        "https://vinfastauto.com/vn_vi/thong-so-vf-6-moi-nhat",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf6.html",
    ],
    "VF 7": ["https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf7.html"],
    "VF 8": [
        "https://vinfastauto.com/vn_vi/tong-quan-o-to-dien-vinfast-vf-8",
        "https://vinfastauto.com/vn_vi/thong-so-ky-thuat-vinfast-vf8",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-vf8.html",
    ],
    "VF 9": [
        "https://vinfastauto.com/vn_vi/thong-so-ky-thuat-vinfast-vf9",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-vf9.html",
    ],
    "all": [
        "https://vinfastauto.com/vn_vi/cau-hoi-thuong-gap",
        "https://vinfastauto.com/vn_vi/bang-gia-xe",
        "https://shop.vinfastauto.com/vn_vi/so-sanh-xe-vinfast",
    ],
}

# Metadata tĩnh: thông tin không thể parse từ text
STATIC_METADATA = {
    "VF 3": {"body_style": "Hatchback",  "drivetrain": "RWD", "seats": 4},
    "VF 5": {"body_style": "SUV hạng A", "drivetrain": "FWD", "seats": 5},
    "VF 6": {"body_style": "SUV hạng B", "drivetrain": "FWD", "seats": 5},
    "VF 7": {"body_style": "SUV hạng C", "drivetrain": "AWD", "seats": 7},
    "VF 8": {"body_style": "D-SUV",      "drivetrain": "AWD", "seats": 5},
    "VF 9": {"body_style": "SUV hạng E", "drivetrain": "AWD", "seats": 7},
}

EXTRACT_SCRIPT = """
() => {
    var noiseTag = ['nav','footer','script','style','noscript','header'];
    noiseTag.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) { el.remove(); });
    });

    var bodyText = document.body.innerText || '';
    var priceData = [];

    var reMoney   = new RegExp('\\\\d{3}\\\\.\\\\d{3}\\\\.\\\\d{3}');
    var reVariant = new RegExp('(eco|plus|base|standard)', 'i');

    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, [class*="price"], [class*="Price"]');
    headings.forEach(function(el) {
        var t = (el.innerText || '').trim();
        if (t && reMoney.test(t)) priceData.push(t);
    });

    document.querySelectorAll('*').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = (el.innerText || '').trim();
        if (!reMoney.test(t)) return;
        var ancestor = el.closest('section') || el.closest('div') || el.parentElement;
        var labelEl  = ancestor
            ? (ancestor.querySelector('h2') || ancestor.querySelector('h3') ||
               ancestor.querySelector('h4') || ancestor.querySelector('strong'))
            : null;
        var label = labelEl ? (labelEl.innerText || '').trim() : '';
        priceData.push(label ? (label + ': ' + t) : t);
    });

    var seen = {};
    var unique = [];
    priceData.forEach(function(item) {
        var key = item.trim();
        if (key && !seen[key]) { seen[key] = true; unique.push(key); }
    });

    return { text: bodyText, price_hints: unique.slice(0, 30) };
}
"""


# ── Crawl ─────────────────────────────────────────────────────────────────────
async def crawl_page(context, model: str, url: str) -> dict | None:
    try:
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        if "shop." in url:
            await page.wait_for_timeout(5000)

        result      = await page.evaluate(EXTRACT_SCRIPT)
        title       = await page.title()
        await page.close()

        text        = result.get("text", "").strip()
        price_hints = result.get("price_hints", [])

        if len(text) < 200:
            print(f"  ⚠️  [{model}] Trang quá ngắn: {url}")
            return None

        if price_hints:
            text += "\n\n--- PRICE_HINTS ---\n" + "\n".join(price_hints)

        doc_type = "price" if "shop." in url else ("spec" if "thong-so" in url else "overview")
        print(f"  ✅ [{model}][{doc_type}] {len(text):,} chars | {len(price_hints)} price hints")

        return {
            "model":        model,
            "url":          url,
            "title":        title,
            "doc_type":     doc_type,
            "markdown":     text,
            "price_hints":  price_hints,
            "crawled_at":   datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        print(f"  ❌ [{model}] {url} → {e}")
        return None


async def crawl_vinfastauto() -> list[dict]:
    results  = []
    url_list = [(m, u) for m, urls in VINFAST_AUTO_URLS.items() for u in urls]

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        await context.route(
            "**/*.{png,jpg,jpeg,gif,svg,woff,woff2,css}",
            lambda route: route.abort()
        )

        for model, url in url_list:
            print(f"→ Crawling [{model}]: {url}")
            data = await crawl_page(context, model, url)
            if data:
                results.append(data)
            await asyncio.sleep(3 if "shop." in url else 2)

        await browser.close()

    print(f"\n✅ Hoàn thành crawl: {len(results)} trang\n")
    return results


# ── Parse helpers ─────────────────────────────────────────────────────────────
def _extract_int(pattern: str, text: str) -> int | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None
    raw = re.sub(r"[.,\s]", "", m.group(1))
    return int(raw) if raw.isdigit() else None

def _extract_float(pattern: str, text: str) -> float | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None

def _parse_price_from_hints(price_hints: list[str]) -> int | None:
    """
    Duyệt price_hints, lấy số tiền đầu tiên ≥ 100 triệu.
    Ưu tiên hint có chứa 'Eco' hoặc 'Plus' để lấy đúng giá xe.
    """
    candidates = []
    for hint in price_hints:
        numbers = re.findall(r"\d{1,3}(?:\.\d{3}){2,}", hint)
        for num in numbers:
            val = int(num.replace(".", ""))
            if val >= 100_000_000:
                # Ưu tiên hint có variant label
                priority = 0 if re.search(r"\b(eco|plus)\b", hint, re.IGNORECASE) else 1
                candidates.append((priority, val))
    if not candidates:
        return None
    candidates.sort()
    return candidates[0][1]

def _parse_all_variant_prices(text: str) -> list[dict]:
    """
    Parse từ raw text lấy từng cặp (variant, price).
    Trả về list[{"trim_level": ..., "price_vnd": ...}]
    """
    found = {}

    # Pattern: "Eco\n302.000.000 VNĐ" hoặc "VF 3 Eco\n302.000.000 VNĐ"
    for m in re.finditer(
        r"\b(eco|plus|base|standard|lite)\b[^\d\n]{0,30}"
        r"([\d]{1,3}(?:[.,]\d{3})+)\s*(?:VN[ĐD]|VND|dong)?",
        text, re.IGNORECASE
    ):
        variant = m.group(1).capitalize()
        val     = int(re.sub(r"[.,]", "", m.group(2)))
        if val >= 100_000_000:
            found[variant] = val

    # Fallback: 2 số tiền lớn đầu tiên → Eco + Plus
    if not found:
        all_prices = sorted(set(
            int(re.sub(r"[.,]", "", p))
            for p in re.findall(r"[\d]{1,3}(?:[.,]\d{3}){2,}", text)
            if int(re.sub(r"[.,]", "", p)) >= 100_000_000
        ))
        if len(all_prices) >= 2:
            found["Eco"]  = all_prices[0]
            found["Plus"] = all_prices[1]
        elif all_prices:
            found["Standard"] = all_prices[0]

    return [{"trim_level": k, "price_vnd": v} for k, v in found.items()] \
           or [{"trim_level": "Standard", "price_vnd": None}]

def _parse_detailed_specs(text: str) -> dict:
    return {
        "length_mm":       _extract_int(r"(?:dài|chiều dài tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "width_mm":        _extract_int(r"(?:rộng|chiều rộng tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "height_mm":       _extract_int(r"(?:cao|chiều cao tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "wheelbase_mm":    _extract_int(r"(?:chiều dài cơ sở|wheelbase)[^\d]*(\d[\d.]+)\s*mm", text),
        "motor_power_kw":  _extract_int(r"công suất[^\d]*(\d+)\s*kw", text),
        "torque_nm":       _extract_int(r"mô.men xoắn[^\d]*(\d+)\s*nm", text),
        "charge_time_min": _extract_int(r"(?:sạc nhanh|10.*?70%)[^\d]*(\d+)\s*phút", text),
        "top_speed_kmh":   _extract_int(r"tốc độ tối đa[^\d]*(\d+)\s*km/h", text),
        "accel_0_100_s":   _extract_float(r"0.100\s*km/h[^\d]*(\d+[,.]?\d*)\s*giây", text),
        "screen_inch":     _extract_float(r"màn hình[^\d]*(\d+[,.]?\d*)\s*inch", text),
        "has_adas":        int(bool(re.search(r"\badas\b",         text, re.IGNORECASE))),
        "has_carplay":     int(bool(re.search(r"apple carplay",    text, re.IGNORECASE))),
        "has_ota":         int(bool(re.search(r"\bota\b",          text, re.IGNORECASE))),
        "has_360_camera":  int(bool(re.search(r"camera 360",       text, re.IGNORECASE))),
        "has_sunroof":     int(bool(re.search(r"cửa sổ trời",      text, re.IGNORECASE))),
    }


# ── Database ──────────────────────────────────────────────────────────────────
def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode  = WAL")
    return conn


def init_database():
    conn   = get_conn()
    cursor = conn.cursor()

    # ── 1. Thông số kỹ thuật + metadata theo từng phiên bản ──────────────
    # Lưu ý: SQLite không hỗ trợ DEFAULT (datetime('now')) trong CREATE TABLE
    # → updated_at / crawled_at được truyền giá trị tường minh trong mỗi INSERT

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Vehicle_Price (
            car_id           TEXT    PRIMARY KEY,           -- VF3_ECO, VF8_PLUS ...
            model_name       TEXT    NOT NULL,              -- VinFast VF 3
            variant          TEXT    NOT NULL DEFAULT 'Standard',
            retail_price     INTEGER,                       -- giá niêm yết (VNĐ)
            body_style       TEXT,                          -- Hatchback, SUV, D-SUV ...
            seats            INTEGER,                       -- 4, 5, 7
            range_km         INTEGER,                       -- km/lần sạc
            battery_capacity REAL,                          -- kWh
            drivetrain       TEXT,                          -- FWD | RWD | AWD
            detailed_specs   TEXT    DEFAULT '{}',          -- JSON: các thông số còn lại
            source_url       TEXT,
            updated_at       TEXT                           -- datetime('now') via INSERT
        )
    """)

    # ── 2. Tính năng theo category ────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Vehicle_Features (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            car_id         TEXT    REFERENCES Vehicle_Price(car_id) ON DELETE CASCADE,
            category       TEXT,                            -- safety | comfort | tech | adas
            feature_name   TEXT,
            feature_detail TEXT,
            updated_at     TEXT
        )
    """)

    # ── 3. Phí đăng ký theo tỉnh/thành ───────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Location_Tax_Fee (
            location_id           TEXT    PRIMARY KEY,
            location_name         TEXT,
            registration_tax_rate REAL    DEFAULT 0,        -- tỷ lệ phí trước bạ
            plate_fee             INTEGER DEFAULT 0,        -- phí đăng ký biển số
            other_fee             INTEGER DEFAULT 0,
            updated_at            TEXT
        )
    """)

    # ── 4. Crawl log ──────────────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Crawl_Log (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            url              TEXT,
            car_id           TEXT,
            model            TEXT,
            doc_type         TEXT,
            chars            INTEGER,
            status           TEXT,                          -- success | failed | partial
            missing_fields   TEXT    DEFAULT '[]',          -- JSON array
            extracted_fields TEXT    DEFAULT '[]',          -- JSON array
            error_message    TEXT,
            crawled_at       TEXT
        )
    """)

    # Seed Location_Tax_Fee
    now = datetime.now(timezone.utc).isoformat()
    cursor.executemany("""
        INSERT OR IGNORE INTO Location_Tax_Fee
            (location_id, location_name, registration_tax_rate, plate_fee, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, [
        ("HN",    "Hà Nội",           0.12, 1_000_000, now),
        ("HCM",   "TP. Hồ Chí Minh",  0.12, 1_000_000, now),
        ("DN",    "Đà Nẵng",          0.10, 1_000_000, now),
        ("HP",    "Hải Phòng",        0.10, 1_000_000, now),
        ("CT",    "Cần Thơ",          0.10, 1_000_000, now),
        ("OTHER", "Tỉnh khác",        0.08, 1_000_000, now),
    ])

    conn.commit()
    conn.close()
    print("✅ Database sẵn sàng!")


def save_to_db(crawled_results: list[dict]):
    # Đảm bảo schema luôn tồn tại trước khi ghi —
    # phòng trường hợp gọi từ file khác hoặc DB_PATH chưa được init
    init_database()

    conn   = get_conn()
    cursor = conn.cursor()

    for item in crawled_results:
        model       = item["model"]
        url         = item["url"]
        doc_type    = item["doc_type"]
        text        = item.get("markdown", "")
        price_hints = item.get("price_hints", [])
        meta        = STATIC_METADATA.get(model, {})

        if model == "all":
            continue

        try:
            # ── Parse thông số kỹ thuật ───────────────────────────────────
            detailed = _parse_detailed_specs(text)

            # range_km từ text
            range_km = (
                _extract_int(r"(\d{3})\s*km[^\d]*(?:wltp|nedc|một lần sạc)", text)
                or _extract_int(r"quãng đường[^\d]*(\d{3})\s*km", text)
            )

            # battery_capacity từ text
            battery = _extract_float(r"(\d+[.,]\d+)\s*kwh", text)

            # ── Parse giá (chỉ từ trang price) ───────────────────────────
            if doc_type == "price":
                variants_prices = _parse_all_variant_prices(text)
            else:
                # Trang spec/overview: không có giá chính xác, bỏ qua insert price
                variants_prices = []

            extracted_fields = []
            missing_fields   = []

            if variants_prices:
                # Có giá → insert/update từng phiên bản
                for vp in variants_prices:
                    trim     = vp["trim_level"]
                    price    = vp["price_vnd"]
                    car_id   = f"{model.replace(' ', '')}_{trim.upper()}"

                    cursor.execute("""
                        INSERT INTO Vehicle_Price (
                            car_id, model_name, variant, retail_price,
                            body_style, seats, range_km, battery_capacity,
                            drivetrain, detailed_specs, source_url, updated_at
                        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
                        ON CONFLICT(car_id) DO UPDATE SET
                            retail_price     = COALESCE(excluded.retail_price,     retail_price),
                            body_style       = COALESCE(excluded.body_style,       body_style),
                            seats            = COALESCE(excluded.seats,            seats),
                            range_km         = COALESCE(excluded.range_km,         range_km),
                            battery_capacity = COALESCE(excluded.battery_capacity, battery_capacity),
                            drivetrain       = COALESCE(excluded.drivetrain,       drivetrain),
                            detailed_specs   = excluded.detailed_specs,
                            source_url       = excluded.source_url,
                            updated_at       = datetime('now')
                    """, (
                        car_id,
                        f"VinFast {model}",
                        trim,
                        price,
                        meta.get("body_style"),
                        meta.get("seats"),
                        range_km,
                        battery,
                        meta.get("drivetrain"),
                        json.dumps(detailed, ensure_ascii=False),
                        url,
                    ))

                    # Tracking fields
                    for f, v in {"retail_price": price, "range_km": range_km,
                                 "battery_capacity": battery, "seats": meta.get("seats")}.items():
                        (extracted_fields if v else missing_fields).append(f)

                    print(f"  💾 [{car_id}] giá={f'{price:,}đ' if price else 'NULL ⚠️'}")

            else:
                # Trang spec/overview: chỉ update thông số kỹ thuật vào row đã có
                car_id = f"{model.replace(' ', '')}_STANDARD"
                cursor.execute("""
                    INSERT INTO Vehicle_Price (
                        car_id, model_name, variant,
                        body_style, seats, range_km, battery_capacity,
                        drivetrain, detailed_specs, source_url, updated_at
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))
                    ON CONFLICT(car_id) DO UPDATE SET
                        body_style       = COALESCE(excluded.body_style,       body_style),
                        seats            = COALESCE(excluded.seats,            seats),
                        range_km         = COALESCE(excluded.range_km,         range_km),
                        battery_capacity = COALESCE(excluded.battery_capacity, battery_capacity),
                        drivetrain       = COALESCE(excluded.drivetrain,       drivetrain),
                        detailed_specs   = excluded.detailed_specs,
                        source_url       = excluded.source_url,
                        updated_at       = datetime('now')
                """, (
                    car_id,
                    f"VinFast {model}",
                    "Standard",
                    meta.get("body_style"),
                    meta.get("seats"),
                    range_km,
                    battery,
                    meta.get("drivetrain"),
                    json.dumps(detailed, ensure_ascii=False),
                    url,
                ))

                for f, v in {"range_km": range_km, "battery_capacity": battery,
                             "seats": meta.get("seats")}.items():
                    (extracted_fields if v else missing_fields).append(f)

            # Ghi crawl log
            cursor.execute("""
                INSERT INTO Crawl_Log
                    (url, car_id, model, doc_type, chars, status,
                     missing_fields, extracted_fields)
                VALUES (?,?,?,?,?,?,?,?)
            """, (
                url, car_id, model, doc_type, len(text), "success",
                json.dumps(missing_fields,   ensure_ascii=False),
                json.dumps(extracted_fields, ensure_ascii=False),
            ))

        except Exception as e:
            cursor.execute("""
                INSERT INTO Crawl_Log (url, model, doc_type, chars, status, error_message)
                VALUES (?,?,?,?,?,?)
            """, (url, model, doc_type, len(text), "failed", str(e)))
            print(f"  ❌ save_to_db [{model}]: {e}")

    conn.commit()
    conn.close()
    print(f"\n✅ Đã lưu {len(crawled_results)} bản ghi vào database!")


def show_all_data():
    conn   = get_conn()
    cursor = conn.cursor()

    print("\n" + "=" * 100)
    print("📊 DỮ LIỆU VEHICLE_PRICE")
    print("=" * 100)
    print(f"  {'car_id':<15} {'model_name':<22} {'variant':<10} {'retail_price':>18} "
          f"{'range_km':>9} {'seats':>6} {'drivetrain':>10}")
    print(f"  {'-'*95}")

    rows = cursor.execute("""
        SELECT car_id, model_name, variant, retail_price,
               range_km, seats, drivetrain
        FROM Vehicle_Price
        ORDER BY model_name, variant
    """).fetchall()

    if not rows:
        print("  ❌ Chưa có dữ liệu nào.")
    for r in rows:
        price_str = f"{r['retail_price']:,}đ".replace(",", ".") if r["retail_price"] else "NULL ⚠️"
        range_str = str(r["range_km"]) if r["range_km"] else "—"
        seats_str = str(r["seats"])    if r["seats"]    else "—"
        drv_str   = r["drivetrain"]    or "—"
        print(f"  {r['car_id']:<15} {r['model_name']:<22} {r['variant']:<10} "
              f"{price_str:>18} {range_str:>9} {seats_str:>6} {drv_str:>10}")

    print("\n📋 CRAWL LOG (10 gần nhất)")
    print("=" * 100)
    logs = cursor.execute("""
        SELECT car_id, model, doc_type, chars, status, missing_fields, crawled_at
        FROM Crawl_Log ORDER BY id DESC LIMIT 10
    """).fetchall()
    for l in logs:
        missing = json.loads(l["missing_fields"] or "[]")
        miss_str = ", ".join(missing) if missing else "—"
        print(f"  [{l['status']:>8}] {(l['car_id'] or '?'):<15} [{l['doc_type']:<8}] "
              f"{l['chars']:>7} chars | missing: {miss_str}")

    conn.close()


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_database()
    crawled_data = asyncio.run(crawl_vinfastauto())
    if crawled_data:
        save_to_db(crawled_data)
    show_all_data()