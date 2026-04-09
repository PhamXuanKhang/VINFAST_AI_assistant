# crawlers/vinfastauto_crawler.py
import asyncio
import sqlite3
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright

DB_PATH = str(Path(__file__).parent / "vinfast.db")

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
}

STATIC_METADATA = {
    "VF 3": {"body_style": "Hatchback",  "drivetrain": "RWD", "seats": 4},
    "VF 5": {"body_style": "SUV hạng A", "drivetrain": "FWD", "seats": 5},
    "VF 6": {"body_style": "SUV hạng B", "drivetrain": "FWD", "seats": 5},
    "VF 7": {"body_style": "SUV hạng C", "drivetrain": "AWD", "seats": 7},
    "VF 8": {"body_style": "D-SUV",      "drivetrain": "AWD", "seats": 5},
    "VF 9": {"body_style": "SUV hạng E", "drivetrain": "AWD", "seats": 7},
}

# Fallback giá niêm yết (đã bao gồm pin) — cập nhật tháng 4/2026
FALLBACK_PRICES = {
    "VF3_STANDARD": ("VF 3",       "VF 3 Standard",    302_000_000),
    "VF5_PLUS":     ("VF 5",       "VF 5 Plus",        548_000_000),
    "VF6_BASE":     ("VF 6",       "VF 6 Base",        675_000_000),
    "VF6_PLUS":     ("VF 6",       "VF 6 Plus",        739_000_000),
    "VF7_BASE":     ("VF 7",       "VF 7 Base",        850_000_000),
    "VF7_PLUS":     ("VF 7",       "VF 7 Plus",        950_000_000),
    "VF8_ECO":      ("VF 8",       "VF 8 Eco",       1_129_000_000),
    "VF8_PLUS":     ("VF 8",       "VF 8 Plus",      1_319_000_000),
    "VF9_BASE":     ("VF 9",       "VF 9 Base",      1_469_000_000),
    "VF9_PLUS":     ("VF 9",       "VF 9 Plus",      1_669_000_000),
}

EXTRACT_SCRIPT = """
() => {
    var noiseTag = ['nav','footer','script','style','noscript','header'];
    noiseTag.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) { el.remove(); });
    });
    var bodyText = document.body.innerText || '';
    var priceData = [];
    var reMoney = new RegExp('\\\\d{3}\\\\.\\\\d{3}\\\\.\\\\d{3}');

    var headings = document.querySelectorAll('h1,h2,h3,h4,h5,[class*="price"],[class*="Price"]');
    headings.forEach(function(el) {
        var t = (el.innerText || '').trim();
        if (t && reMoney.test(t)) priceData.push(t);
    });

    document.querySelectorAll('*').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = (el.innerText || '').trim();
        if (!reMoney.test(t)) return;
        var ancestor = el.closest('section') || el.closest('div') || el.parentElement;
        var labelEl = ancestor
            ? (ancestor.querySelector('h2') || ancestor.querySelector('h3') ||
               ancestor.querySelector('h4') || ancestor.querySelector('strong'))
            : null;
        var label = labelEl ? (labelEl.innerText || '').trim() : '';
        priceData.push(label ? (label + ': ' + t) : t);
    });

    var seen = {}, unique = [];
    priceData.forEach(function(item) {
        var key = item.trim();
        if (key && !seen[key]) { seen[key] = true; unique.push(key); }
    });
    return { text: bodyText, price_hints: unique.slice(0, 30) };
}
"""


# ── Crawl ──────────────────────────────────────────────────────────────────
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

        doc_type = ("price"    if "shop."    in url
                    else "spec" if "thong-so" in url
                    else "overview")
        print(f"  ✅ [{model}][{doc_type}] {len(text):,} chars | {len(price_hints)} price hints")

        return {
            "model":       model,
            "url":         url,
            "title":       title,
            "doc_type":    doc_type,
            "markdown":    text,
            "price_hints": price_hints,
            "crawled_at":  datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        print(f"  ❌ [{model}] {url} → {e}")
        return None


async def crawl_vinfastauto() -> list[dict]:
    results  = []
    url_list = [(m, u) for m, urls in VINFAST_AUTO_URLS.items() for u in urls]

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
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
            print(f"→ [{model}]: {url}")
            data = await crawl_page(context, model, url)
            if data:
                results.append(data)
            await asyncio.sleep(3 if "shop." in url else 2)

        await browser.close()

    print(f"\n✅ Hoàn thành: {len(results)} trang\n")
    return results


# ── Parse helpers ──────────────────────────────────────────────────────────
def _int(pattern: str, text: str) -> int | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None
    raw = re.sub(r"[.,\s]", "", m.group(1))
    return int(raw) if raw.isdigit() else None

def _float(pattern: str, text: str) -> float | None:
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None

def _parse_variant_prices(text: str, model: str) -> list[dict]:
    """
    Parse giá niêm yết (đã bao gồm pin) theo từng trim.
    Trả về list[{car_id, model_name, trim_level, retail_price}].
    """
    found: dict[str, int] = {}

    # Pattern: tên trim + số tiền
    for m in re.finditer(
        r"\b(eco|plus|base|standard|lite)\b[^\d\n]{0,30}"
        r"([\d]{1,3}(?:[.,]\d{3})+)\s*(?:VN[ĐD]|VND)?",
        text, re.IGNORECASE
    ):
        trim = m.group(1).capitalize()
        val  = int(re.sub(r"[.,]", "", m.group(2)))
        if val >= 100_000_000:
            found[trim] = val

    # Fallback: lấy 2 số lớn nhất nếu không parse được trim
    if not found:
        prices = sorted(set(
            int(re.sub(r"[.,]", "", p))
            for p in re.findall(r"[\d]{1,3}(?:[.,]\d{3}){2,}", text)
            if int(re.sub(r"[.,]", "", p)) >= 100_000_000
        ))
        if len(prices) >= 2:
            found["Eco"]  = prices[0]
            found["Plus"] = prices[1]
        elif prices:
            found["Standard"] = prices[0]

    model_code = model.replace(" ", "")
    results = []
    for trim, price in found.items():
        results.append({
            "car_id":       f"{model_code}_{trim.upper()}",
            "model_name":   f"{model} {trim}",
            "trim_level":   trim,
            "retail_price": price,
        })

    return results or [{
        "car_id":       f"{model_code}_STANDARD",
        "model_name":   f"{model} Standard",
        "trim_level":   "Standard",
        "retail_price": None,
    }]

def _parse_detailed_specs(text: str) -> dict:
    return {k: v for k, v in {
        "length_mm":       _int(r"(?:dài|chiều dài tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "width_mm":        _int(r"(?:rộng|chiều rộng tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "height_mm":       _int(r"(?:cao|chiều cao tổng thể)[^\d]*(\d[\d.]+)\s*mm", text),
        "wheelbase_mm":    _int(r"(?:chiều dài cơ sở|wheelbase)[^\d]*(\d[\d.]+)\s*mm", text),
        "ground_mm":       _int(r"khoảng sáng gầm[^\d]*(\d+)\s*mm", text),
        "motor_power_kw":  _int(r"công suất[^\d]*(\d+)\s*kw", text),
        "torque_nm":       _int(r"mô.men xoắn[^\d]*(\d+)\s*nm", text),
        "charge_dc_min":   _int(r"(?:sạc nhanh|10.*?70%)[^\d]*(\d+)\s*phút", text),
        "top_speed_kmh":   _int(r"tốc độ tối đa[^\d]*(\d+)\s*km/h", text),
        "accel_0_100_s":   _float(r"0.100\s*km/h[^\d]*(\d+[,.]?\d*)\s*giây", text),
        "screen_inch":     _float(r"màn hình[^\d]*(\d+[,.]?\d*)\s*inch", text),
        "has_adas":        int(bool(re.search(r"\badas\b",       text, re.I))),
        "has_carplay":     int(bool(re.search(r"apple carplay",  text, re.I))),
        "has_ota":         int(bool(re.search(r"\bota\b",        text, re.I))),
        "has_360_camera":  int(bool(re.search(r"camera 360",     text, re.I))),
        "has_sunroof":     int(bool(re.search(r"cửa sổ trời",    text, re.I))),
        "has_heated_seat": int(bool(re.search(r"ghế sưởi",       text, re.I))),
    }.items() if v is not None}


# ── Database ───────────────────────────────────────────────────────────────
def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode  = WAL")
    return conn


def init_database():
    conn = get_conn()
    cur  = conn.cursor()
    now  = datetime.now(timezone.utc).isoformat()

    # ── 1. Vehicle_Price — giá niêm yết (đã gồm pin) ──────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Vehicle_Price (
            car_id         TEXT    PRIMARY KEY,
            model_name     TEXT    NOT NULL,
            retail_price   INTEGER NOT NULL,
            effective_date TEXT    NOT NULL,
            updated_at     TEXT    NOT NULL
        )
    """)

    # ── 2. Vehicle_Details — thông số kỹ thuật ────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Vehicle_Details (
            car_id           TEXT    PRIMARY KEY,
            model_series     TEXT    NOT NULL,
            trim_level       TEXT    NOT NULL    DEFAULT 'Standard',
            body_style       TEXT,
            seats            INTEGER,
            range_wltp_km    INTEGER,
            battery_capacity REAL,
            drivetrain       TEXT,
            is_active        INTEGER             DEFAULT 1,
            detailed_specs   TEXT                DEFAULT '{}',
            source_url       TEXT,
            updated_at       TEXT
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vd_model  ON Vehicle_Details (model_series)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vd_active ON Vehicle_Details (is_active)")

    # ── 3. Location_Tax_Fee ───────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Location_Tax_Fee (
            location_id           TEXT    PRIMARY KEY,
            location_name         TEXT    NOT NULL,
            registration_tax_rate REAL    DEFAULT 0,
            plate_fee             INTEGER DEFAULT 0,
            inspection_fee        INTEGER DEFAULT 0,
            road_usage_fee        INTEGER DEFAULT 0,
            insurance_civil       INTEGER DEFAULT 0,
            updated_at            TEXT
        )
    """)

    # ── 4. Bank_Loan_Policy ───────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Bank_Loan_Policy (
            bank_id               TEXT    PRIMARY KEY,
            bank_name             TEXT    NOT NULL,
            max_loan_percentage   REAL    DEFAULT 0.80,
            interest_rate_promo   REAL,
            interest_rate_normal  REAL,
            promo_period_months   INTEGER,
            max_term_months       INTEGER DEFAULT 84,
            min_down_payment      REAL    DEFAULT 0.20,
            notes                 TEXT,
            updated_at            TEXT
        )
    """)

    # ── Seed Vehicle_Price (fallback) ─────────────────────────────────
    today = now[:10]
    cur.executemany("""
        INSERT OR IGNORE INTO Vehicle_Price
            (car_id, model_name, retail_price, effective_date, updated_at)
        VALUES (?,?,?,?,?)
    """, [
        (car_id, model_name, price, today, now)
        for car_id, (_, model_name, price) in FALLBACK_PRICES.items()
    ])

    # ── Seed Location_Tax_Fee ─────────────────────────────────────────
    cur.executemany("""
        INSERT OR IGNORE INTO Location_Tax_Fee
            (location_id, location_name, registration_tax_rate,
             plate_fee, inspection_fee, road_usage_fee, insurance_civil, updated_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, [
        ("HN",    "Hà Nội",          0.0, 20_000_000, 340_000, 1_560_000, 480_000, now),
        ("HCM",   "TP. Hồ Chí Minh", 0.0, 20_000_000, 340_000, 1_560_000, 480_000, now),
        ("DN",    "Đà Nẵng",         0.0,  1_000_000, 340_000, 1_560_000, 480_000, now),
        ("HP",    "Hải Phòng",       0.0,  1_000_000, 340_000, 1_560_000, 480_000, now),
        ("CT",    "Cần Thơ",         0.0,  1_000_000, 340_000, 1_560_000, 480_000, now),
        ("OTHER", "Tỉnh khác",       0.0,  1_000_000, 340_000, 1_560_000, 480_000, now),
    ])

    # ── Seed Bank_Loan_Policy ─────────────────────────────────────────
    cur.executemany("""
        INSERT OR IGNORE INTO Bank_Loan_Policy
            (bank_id, bank_name, max_loan_percentage,
             interest_rate_promo, interest_rate_normal,
             promo_period_months, max_term_months, min_down_payment, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)
    """, [
        ("VCB",  "Vietcombank",     0.80, 0.079, 0.110, 12, 84, 0.20, now),
        ("BIDV", "BIDV",            0.80, 0.075, 0.105, 12, 84, 0.20, now),
        ("TCB",  "Techcombank",     0.85, 0.080, 0.115, 12, 84, 0.15, now),
        ("MBB",  "MB Bank",         0.80, 0.076, 0.108, 12, 84, 0.20, now),
        ("VPB",  "VPBank",          0.85, 0.082, 0.118, 12, 84, 0.15, now),
        ("ACB",  "ACB",             0.80, 0.078, 0.112, 12, 84, 0.20, now),
        ("VIF",  "VinFast Finance", 0.90, 0.068, 0.099, 24, 96, 0.10, now),
    ])

    conn.commit()
    conn.close()
    print("✅ Database sẵn sàng!")


def save_to_db(crawled_results: list[dict]):
    conn = get_conn()
    cur  = conn.cursor()
    now  = datetime.now(timezone.utc).isoformat()
    today = now[:10]

    for item in crawled_results:
        model    = item["model"]
        url      = item["url"]
        doc_type = item["doc_type"]
        text     = item.get("markdown", "")
        meta     = STATIC_METADATA.get(model, {})

        if model == "all":
            continue

        detailed   = _parse_detailed_specs(text)
        range_wltp = _int(r"(\d{3})\s*km[^\d]*(?:wltp|nedc|một lần sạc)", text)
        battery    = _float(r"(\d+[.,]\d+)\s*kwh", text)

        if doc_type == "price":
            variants = _parse_variant_prices(text, model)
            for vp in variants:
                car_id     = vp["car_id"]
                model_name = vp["model_name"]
                trim       = vp["trim_level"]
                price      = vp["retail_price"]

                # Cập nhật Vehicle_Price nếu crawl được giá thực
                if price:
                    cur.execute("""
                        INSERT INTO Vehicle_Price
                            (car_id, model_name, retail_price, effective_date, updated_at)
                        VALUES (?,?,?,?,?)
                        ON CONFLICT(car_id) DO UPDATE SET
                            model_name     = excluded.model_name,
                            retail_price   = excluded.retail_price,
                            effective_date = excluded.effective_date,
                            updated_at     = excluded.updated_at
                    """, (car_id, model_name, price, today, now))
                    flag = f"{price:,}đ".replace(",", ".")
                    print(f"  💰 {car_id:<16} {flag}")

                # Upsert Vehicle_Details
                cur.execute("""
                    INSERT INTO Vehicle_Details
                        (car_id, model_series, trim_level, body_style, seats,
                         range_wltp_km, battery_capacity, drivetrain,
                         is_active, detailed_specs, source_url, updated_at)
                    VALUES (?,?,?,?,?,?,?,?,1,?,?,?)
                    ON CONFLICT(car_id) DO UPDATE SET
                        range_wltp_km    = COALESCE(excluded.range_wltp_km,    range_wltp_km),
                        battery_capacity = COALESCE(excluded.battery_capacity, battery_capacity),
                        detailed_specs   = excluded.detailed_specs,
                        source_url       = excluded.source_url,
                        updated_at       = excluded.updated_at
                """, (
                    car_id, model, trim,
                    meta.get("body_style"), meta.get("seats"),
                    range_wltp, battery, meta.get("drivetrain"),
                    json.dumps(detailed, ensure_ascii=False),
                    url, now,
                ))

        else:
            # Trang spec/overview: chỉ update Vehicle_Details
            car_id = f"{model.replace(' ', '')}_STANDARD"
            cur.execute("""
                INSERT INTO Vehicle_Details
                    (car_id, model_series, trim_level, body_style, seats,
                     range_wltp_km, battery_capacity, drivetrain,
                     is_active, detailed_specs, source_url, updated_at)
                VALUES (?,?,?,?,?,?,?,?,1,?,?,?)
                ON CONFLICT(car_id) DO UPDATE SET
                    range_wltp_km    = COALESCE(excluded.range_wltp_km,    range_wltp_km),
                    battery_capacity = COALESCE(excluded.battery_capacity, battery_capacity),
                    detailed_specs   = excluded.detailed_specs,
                    source_url       = excluded.source_url,
                    updated_at       = excluded.updated_at
            """, (
                car_id, model, "Standard",
                meta.get("body_style"), meta.get("seats"),
                range_wltp, battery, meta.get("drivetrain"),
                json.dumps(detailed, ensure_ascii=False),
                url, now,
            ))

        conn.commit()

    conn.close()
    print(f"\n✅ Đã lưu {len(crawled_results)} bản ghi!")


def show_all_data():
    conn = get_conn()
    cur  = conn.cursor()

    # Vehicle_Price
    print("\n" + "=" * 80)
    print("💰 Vehicle_Price (Giá niêm yết — đã bao gồm pin)")
    print("=" * 80)
    print(f"  {'car_id':<18} {'model_name':<20} {'retail_price':>18} {'effective_date'}")
    print(f"  {'-'*75}")
    for r in cur.execute(
        "SELECT * FROM Vehicle_Price ORDER BY retail_price"
    ).fetchall():
        p = f"{r['retail_price']:,} ₫".replace(",", ".")
        print(f"  {r['car_id']:<18} {r['model_name']:<20} {p:>18}   {r['effective_date']}")

    # Vehicle_Details
    print("\n" + "=" * 110)
    print("🚗 Vehicle_Details (Thông số kỹ thuật)")
    print("=" * 110)
    print(f"  {'car_id':<18} {'model':<8} {'trim':<10} {'body_style':<14} "
          f"{'seats':>5} {'range':>6} {'battery':>8} {'drive':>5}")
    print(f"  {'-'*105}")
    for r in cur.execute(
        "SELECT * FROM Vehicle_Details ORDER BY model_series, trim_level"
    ).fetchall():
        rng = str(r["range_wltp_km"])    if r["range_wltp_km"]    else "—"
        bat = f"{r['battery_capacity']}kWh" if r["battery_capacity"] else "—"
        print(f"  {r['car_id']:<18} {r['model_series']:<8} {r['trim_level']:<10} "
              f"{str(r['body_style'] or '—'):<14} "
              f"{str(r['seats'] or '—'):>5} {rng:>6} {bat:>8} {str(r['drivetrain'] or '—'):>5}")

    # Bank_Loan_Policy
    print("\n" + "=" * 85)
    print("🏦 Bank_Loan_Policy")
    print("=" * 85)
    print(f"  {'bank_id':<6} {'bank_name':<20} {'promo%':>7} {'normal%':>8} "
          f"{'promo_mo':>9} {'max_mo':>7} {'min_down':>9}")
    print(f"  {'-'*80}")
    for r in cur.execute(
        "SELECT * FROM Bank_Loan_Policy ORDER BY interest_rate_promo"
    ).fetchall():
        print(f"  {r['bank_id']:<6} {r['bank_name']:<20} "
              f"{r['interest_rate_promo']*100:>6.1f}% "
              f"{r['interest_rate_normal']*100:>7.1f}% "
              f"{str(r['promo_period_months']):>9} "
              f"{str(r['max_term_months']):>7} "
              f"{r['min_down_payment']*100:>8.0f}%")

    # Location_Tax_Fee
    print("\n" + "=" * 85)
    print("📍 Location_Tax_Fee")
    print("=" * 85)
    print(f"  {'id':<7} {'name':<20} {'tax%':>5} {'plate':>12} "
          f"{'inspect':>9} {'road':>9} {'insur':>9}")
    print(f"  {'-'*80}")
    for r in cur.execute(
        "SELECT * FROM Location_Tax_Fee ORDER BY location_id"
    ).fetchall():
        def fmt(v): return f"{v:,}".replace(",", ".") if v else "0"
        print(f"  {r['location_id']:<7} {r['location_name']:<20} "
              f"{r['registration_tax_rate']*100:>4.0f}% "
              f"{fmt(r['plate_fee']):>12} "
              f"{fmt(r['inspection_fee']):>9} "
              f"{fmt(r['road_usage_fee']):>9} "
              f"{fmt(r['insurance_civil']):>9}")

    conn.close()


# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_database()
    crawled_data = asyncio.run(crawl_vinfastauto())
    if crawled_data:
        save_to_db(crawled_data)
    show_all_data()