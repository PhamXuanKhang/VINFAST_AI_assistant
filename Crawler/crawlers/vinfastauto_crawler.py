# crawlers/vinfastauto_crawler.py
import asyncio
from datetime import datetime, timezone
from playwright.async_api import async_playwright

VINFAST_AUTO_URLS = {
    "VF 3": [
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf3.html",
    ],
    "VF 5": [
        "https://vinfastauto.com/vn_vi/tong-quan-xe-o-to-dien-vinfast-vf-5-plus",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf5.html",
    ],
    "VF 6": [
        "https://vinfastauto.com/vn_vi/thong-so-vf-6-moi-nhat",
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf6.html",
    ],
    "VF 7": [
        "https://shop.vinfastauto.com/vn_vi/dat-coc-xe-dien-vf7.html",
    ],
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


# ── JS snippet: extract text + structured price từ DOM ───────────────────────
# Lưu ý: KHÔNG dùng regex literal /pattern/ trong page.evaluate() vì Playwright
# truyền script dưới dạng string expression → V8 parser lỗi "Unexpected number"
# khi gặp quantifier {n,m} hoặc ký tự Unicode đặc biệt trong literal.
# → Dùng new RegExp("pattern") thay thế toàn bộ.
EXTRACT_SCRIPT = """
() => {
    var noiseTag = ['nav','footer','script','style','noscript','header'];
    noiseTag.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) { el.remove(); });
    });

    var bodyText = document.body.innerText || '';
    var priceData = [];

    // Regex dùng constructor để tránh V8 parse lỗi với quantifier {n,m}
    var reMoney    = new RegExp('\\\\d{3}\\\\.\\\\d{3}\\\\.\\\\d{3}');
    var reLabel    = new RegExp('VND|VND', 'i');
    var reLeafNum  = new RegExp('^\\\\d{1,3}(\\\\.\\\\d{3}){2,}\\\\s*(VND)?$', 'i');
    var reVariant  = new RegExp('(eco|plus|base|standard)', 'i');

    // Selector 1: heading + price elements
    var headings = document.querySelectorAll(
        'h2, h3, h4, h5, [class*="price"], [class*="Price"]'
    );
    headings.forEach(function(el) {
        var t = (el.innerText || '').trim();
        if (t && (reMoney.test(t) || reLabel.test(t))) {
            priceData.push(t);
        }
    });

    // Selector 2: leaf node chứa số tiền → lấy label từ ancestor
    document.querySelectorAll('*').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = (el.innerText || '').trim();
        if (!t || !reLeafNum.test(t)) return;

        var ancestor = el.closest('section') || el.closest('div') || el.parentElement;
        var labelEl  = ancestor
            ? (ancestor.querySelector('h2') || ancestor.querySelector('h3') ||
               ancestor.querySelector('h4') || ancestor.querySelector('h5') ||
               ancestor.querySelector('strong'))
            : null;
        var label = labelEl ? (labelEl.innerText || '').trim() : '';
        priceData.push(label ? (label + ': ' + t) : t);
    });

    // Selector 3: tìm trực tiếp block variant + giá (Eco / Plus)
    document.querySelectorAll('*').forEach(function(el) {
        if (el.children.length > 0) return;
        var t = (el.innerText || '').trim();
        if (reVariant.test(t) && reMoney.test(t)) {
            priceData.push(t);
        }
    });

    // Dedup và giới hạn 30
    var seen = {};
    var unique = [];
    priceData.forEach(function(item) {
        var key = item.trim();
        if (key && !seen[key]) { seen[key] = true; unique.push(key); }
    });

    return {
        text: bodyText,
        price_hints: unique.slice(0, 30)
    };
}
"""


async def crawl_page(context, model: str, url: str) -> dict | None:
    """Crawl một URL, trả về dict kết quả hoặc None nếu lỗi."""
    is_shop = "shop." in url

    # shop cần thời gian render React lâu hơn
    timeout   = 40_000 if is_shop else 30_000
    wait_time = 5_000  if is_shop else 2_500   # ← tăng lên 5s cho shop

    try:
        page = await context.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        await page.goto(url, wait_until="domcontentloaded", timeout=timeout)

        if is_shop:
            # Đợi thêm cho React hydration hoàn tất
            try:
                await page.wait_for_selector(
                    '[class*="price"], h2, h3, h4, h5',
                    timeout=8_000
                )
            except Exception:
                pass  # Không critical, vẫn tiếp tục

        await page.wait_for_timeout(wait_time)

        result = await page.evaluate(EXTRACT_SCRIPT)
        title  = await page.title()
        await page.close()

        text        = result.get("text", "").strip()
        price_hints = result.get("price_hints", [])

        # Bỏ qua trang 404 / rỗng
        if "404" in text[:200] or len(text) < 200:
            print(f"  ⚠️  [{model}] Trang trống hoặc 404: {url}")
            return None

        # Gắn price_hints vào cuối text để parse_prices dùng được
        if price_hints:
            text += "\n\n--- PRICE_HINTS ---\n" + "\n".join(price_hints)

        # Tag doc_type
        if is_shop:
            doc_type = "price"
        elif "thong-so" in url:
            doc_type = "spec"
        elif "cau-hoi" in url:
            doc_type = "faq"
        elif "so-sanh" in url:
            doc_type = "comparison"
        else:
            doc_type = "overview"

        print(f"  ✅ [{model}][{doc_type}]: {len(text):,} chars "
              + (f"| {len(price_hints)} price hints" if price_hints else ""))

        return {
            "model":        model,
            "url":          url,
            "source":       "vinfastauto.com",
            "title":        title,
            "doc_type":     doc_type,
            "markdown":     text,
            "price_hints":  price_hints,
            "crawled_at":   datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        print(f"  ❌ [{model}] {url}: {e}")
        return None


async def crawl_vinfastauto() -> list[dict]:
    """Crawl toàn bộ VINFAST_AUTO_URLS, trả về list kết quả."""
    results  = []
    url_list = [
        (model, url)
        for model, urls in VINFAST_AUTO_URLS.items()
        for url in urls
    ]

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="vi-VN",
            viewport={"width": 1280, "height": 900},
        )
        # Bỏ static assets để tăng tốc (giữ lại JS vì cần render giá)
        await context.route(
            "**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,css}",
            lambda route: route.abort()
        )

        for model, url in url_list:
            print(f"  → [{model}]: {url}")
            page_data = await crawl_page(context, model, url)
            if page_data:
                results.append(page_data)

            # Delay giữa các request để tránh bị block
            delay = 3.0 if "shop." in url else 2.0
            await asyncio.sleep(delay)

        await browser.close()

    print(f"\n📦 Tổng: {len(results)} trang crawled thành công")
    return results