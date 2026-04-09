# parsers/metadata_builder.py
import hashlib
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Literal


class VinFastChunk(BaseModel):
    # Identity
    chunk_id: str
    doc_id: str
    chunk_index: int

    # Content
    text: str

    # Scope — QUAN TRỌNG cho RAG filter
    model: str  # "VF 9", "VF 8", ... hoặc "all"
    doc_type: Literal["spec", "price", "faq", "news", "forum_qa", "installment"]
    category: str  # "battery", "safety", "charging", "interior", ...

    # Source & freshness
    source: str  # "vinfastauto.com" | "vinfast.vn"
    source_url: str
    lang: str = "vi"
    updated_at: str
    ttl_hours: int  # Giá/KM → 24h; Specs → 168h; Forum → 720h

    # Trust
    confidence: Literal["official", "community", "deprecated"] = "official"


def build_chunks(raw: dict, chunk_size: int = 400, overlap: int = 80) -> list[VinFastChunk]:
    """Chia text thành chunks với sliding window, gắn metadata chuẩn."""
    text = raw.get("text") or raw.get("markdown", "")
    words = text.split()
    chunks = []

    i = 0
    idx = 0
    while i < len(words):
        chunk_words = words[i: i + chunk_size]
        chunk_text = " ".join(chunk_words)

        doc_id = raw.get("doc_id") or _make_doc_id(raw["url"])

        chunks.append(VinFastChunk(
            chunk_id=f"{doc_id}-chunk-{idx}",
            doc_id=doc_id,
            chunk_index=idx,
            text=chunk_text,
            model=raw.get("model", "all"),
            doc_type=infer_doc_type(raw),
            category=infer_category(chunk_text),
            source=raw.get("source", "vinfastauto.com"),
            source_url=raw["url"],
            updated_at=raw.get("crawled_at") or raw.get("published_at")
                       or datetime.now(timezone.utc).isoformat(),
            ttl_hours=_ttl(raw.get("doc_type", "")),
            confidence="community" if raw.get("doc_type") == "forum_qa" else "official",
        ))

        i += chunk_size - overlap
        idx += 1

    return chunks


def infer_doc_type(raw: dict) -> str:
    url = raw.get("url", "").lower()
    if "bang-gia" in url or "price" in url:    return "price"
    if "tra-gop" in url or "installment" in url: return "installment"
    if "faq" in url or "cau-hoi" in url:       return "faq"
    if "forum" in url or "dien-dan" in url:    return "forum_qa"
    if "tin-tuc" in url or "news" in url:      return "news"
    return "spec"


def infer_category(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["pin", "kwh", "sạc", "charging", "range", "km"]):
        return "battery_charging"
    if any(k in t for k in ["an toàn", "safety", "airbag", "phanh", "adas"]):
        return "safety"
    if any(k in t for k in ["giá", "price", "triệu", "vnd", "đồng"]):
        return "price"
    if any(k in t for k in ["trả góp", "lãi suất", "ngân hàng", "kỳ hạn"]):
        return "finance"
    if any(k in t for k in ["nội thất", "interior", "ghế", "màn hình"]):
        return "interior"
    return "general"


def _ttl(doc_type: str) -> int:
    return {"price": 24, "installment": 24, "spec": 168, "faq": 720, "forum_qa": 720}.get(doc_type, 168)


def _make_doc_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]