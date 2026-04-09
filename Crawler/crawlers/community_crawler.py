# crawlers/community_crawler.py
import asyncio
import httpx
from bs4 import BeautifulSoup

# vinfast.vn dùng WordPress — có thể dùng WP REST API hoặc scrape trực tiếp
BASE_URL = "https://vinfast.vn"

# Các category hữu ích cho RAG
FORUM_CATEGORIES = {
    "hoi_dap": "/dien-dan/chu-de/hoi-nhanh-dap-gon/",
    "vf3_forum": "/dien-dan/chu-de/vf3/",
    "vf5_forum": "/dien-dan/chu-de/vf5/",
    "vf6_forum": "/dien-dan/chu-de/vf6/",
    "vf7_forum": "/dien-dan/chu-de/vf7/",
    "vf8_forum": "/dien-dan/chu-de/vf8/",
    "vf9_forum": "/dien-dan/chu-de/vf9/",
}

# WordPress REST API — lấy posts/tin tức chính thức
WP_API_ENDPOINTS = {
    "tin_vinfast": f"{BASE_URL}/wp-json/wp/v2/posts?categories=tin-vinfast&per_page=50",
    "faq_posts": f"{BASE_URL}/wp-json/wp/v2/posts?search=FAQ&per_page=30",
}


async def crawl_community(max_threads_per_category: int = 20) -> list[dict]:
    results = []

    async with httpx.AsyncClient(
            headers={"User-Agent": "VinFastBot/1.0 (RAG data collection)"},
            timeout=15.0,
            follow_redirects=True,
    ) as client:

        # 1. Lấy posts qua WP REST API (structured, sạch hơn scrape)
        for name, api_url in WP_API_ENDPOINTS.items():
            resp = await client.get(api_url)
            if resp.status_code == 200:
                posts = resp.json()
                for post in posts:
                    soup = BeautifulSoup(post.get("content", {}).get("rendered", ""), "lxml")
                    results.append({
                        "doc_id": f"wp-{post['id']}",
                        "model": extract_model_from_tags(post.get("tags", [])),
                        "url": post["link"],
                        "source": "vinfast.vn",
                        "doc_type": "news" if "tin" in name else "faq",
                        "title": post["title"]["rendered"],
                        "text": soup.get_text(separator="\n", strip=True),
                        "published_at": post["date"],
                    })
            await asyncio.sleep(1)

        # 2. Scrape forum threads (hỏi đáp thực tế từ chủ xe)
        for cat_name, cat_path in FORUM_CATEGORIES.items():
            threads = await scrape_forum_category(client, BASE_URL + cat_path, max_threads_per_category)
            results.extend(threads)

    return results


async def scrape_forum_category(client, url: str, limit: int) -> list[dict]:
    threads = []
    resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "lxml")

    # Lấy link các thread trong category
    thread_links = [
                       a["href"] for a in soup.select("a.topic-title, a.bbp-topic-permalink")
                       if a.get("href")
                   ][:limit]

    for link in thread_links:
        try:
            r = await client.get(link)
            s = BeautifulSoup(r.text, "lxml")

            title = s.find("h1", class_="bbp-topic-title") or s.find("h1")
            content_divs = s.select(".bbp-reply-content, .bbp-topic-content")

            threads.append({
                "url": link,
                "source": "vinfast.vn",
                "doc_type": "forum_qa",
                "title": title.get_text(strip=True) if title else "",
                "text": "\n---\n".join(d.get_text(separator="\n", strip=True) for d in content_divs),
                "model": extract_model_from_url(link),
            })
            await asyncio.sleep(0.8)
        except Exception as e:
            print(f"  ❌ Thread error {link}: {e}")

    return threads


def extract_model_from_url(url: str) -> str:
    for m in ["vf3", "vf5", "vf6", "vf7", "vf8", "vf9"]:
        if m in url.lower():
            return m.upper().replace("VF", "VF ")
    return "unknown"


def extract_model_from_tags(tags: list) -> str:
    return "unknown"