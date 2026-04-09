# tools/vinfast_tools.py
"""
LangChain tools để query Qdrant cho VinFast RAG Agent.

Payload schema (thực tế từ collection):
  chunk_id, doc_id, chunk_index, text, model, doc_type,
  category, source, source_url, lang, updated_at, ttl_hours, confidence

doc_type values : spec | faq | forum_qa | installment
model values    : VF 3 | VF 5 | VF 6 | VF 7 | VF 8 | VF 9 | all | unknown
"""

from __future__ import annotations

from typing import Literal, Optional

from langchain.tools import tool
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny, Filter as QFilter
from sentence_transformers import SentenceTransformer

# ── Config ────────────────────────────────────────────────────────────────────
QDRANT_HOST = "localhost"
QDRANT_PORT = 7333
COLLECTION  = "vinfast_rag"
EMBED_MODEL = "bkai-foundation-models/vietnamese-bi-encoder"
TOP_K       = 5

DocType = Literal["spec", "faq", "forum_qa", "installment"]
ModelName = Literal["VF 3", "VF 5", "VF 6", "VF 7", "VF 8", "VF 9", "all"]

# ── Singletons (lazy-load để tránh load lúc import) ───────────────────────────
_qdrant: Optional[QdrantClient] = None
_encoder: Optional[SentenceTransformer] = None


def _get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    return _qdrant


def _get_encoder() -> SentenceTransformer:
    global _encoder
    if _encoder is None:
        _encoder = SentenceTransformer(EMBED_MODEL)
    return _encoder


# ── Helper ────────────────────────────────────────────────────────────────────
def _format_hits(hits: list) -> str:
    """Chuyển Qdrant ScoredPoint → chuỗi cho agent đọc."""
    if not hits:
        return "Không tìm thấy thông tin phù hợp trong cơ sở dữ liệu."

    parts = []
    for i, h in enumerate(hits, 1):
        p = h.payload
        parts.append(
            f"[{i}] [{p.get('doc_type','?').upper()}] {p.get('model','')} | "
            f"score={h.score:.3f} | source={p.get('source','?')}\n"
            f"URL: {p.get('source_url','')}\n"
            f"{p.get('text','')[:600]}"
            f"{'...' if len(p.get('text','')) > 600 else ''}"
        )
    return "\n\n---\n\n".join(parts)


def _build_filter(
    doc_types: Optional[list[DocType]] = None,
    models: Optional[list[ModelName]] = None,
) -> Optional[Filter]:
    """Tạo Qdrant Filter từ doc_type và model."""
    conditions = []

    if doc_types:
        conditions.append(
            FieldCondition(key="doc_type", match=MatchAny(any=doc_types))
        )

    if models:
        # Bao gồm "all" để lấy doc áp dụng cho mọi xe
        models_with_all = list(set(models) | {"all"})
        conditions.append(
            FieldCondition(key="model", match=MatchAny(any=models_with_all))
        )

    if not conditions:
        return None

    return QFilter(must=conditions)


# ══════════════════════════════════════════════════════════════════════════════
# Tool 1 — Semantic search tổng quát
# ══════════════════════════════════════════════════════════════════════════════

class SemanticSearchInput(BaseModel):
    query: str = Field(description="Câu hỏi hoặc từ khóa tìm kiếm bằng tiếng Việt")
    top_k: int = Field(default=TOP_K, ge=1, le=20, description="Số kết quả trả về")


@tool(args_schema=SemanticSearchInput)
def vinfast_semantic_search(query: str, top_k: int = TOP_K) -> str:
    """
    Tìm kiếm ngữ nghĩa (semantic search) toàn bộ dữ liệu VinFast.
    Dùng khi câu hỏi không rõ về loại xe hay loại tài liệu cụ thể.
    Ví dụ: 'VinFast có chính sách bảo hành pin như thế nào?'
    """
    encoder = _get_encoder()
    vector = encoder.encode(query).tolist()

    hits = _get_qdrant().search(
        collection_name=COLLECTION,
        query_vector=vector,
        limit=top_k,
        with_payload=True,
    )
    return _format_hits(hits)


# ══════════════════════════════════════════════════════════════════════════════
# Tool 2 — Search theo doc_type
# ══════════════════════════════════════════════════════════════════════════════

class DocTypeSearchInput(BaseModel):
    query: str = Field(description="Câu hỏi cần tìm kiếm")
    doc_types: list[DocType] = Field(
        description=(
            "Loại tài liệu cần tìm. Chọn một hoặc nhiều trong: "
            "'spec' (thông số kỹ thuật, giá), "
            "'faq' (câu hỏi thường gặp chính thức), "
            "'forum_qa' (hỏi đáp cộng đồng chủ xe thực tế), "
            "'installment' (thông tin trả góp)"
        )
    )
    top_k: int = Field(default=TOP_K, ge=1, le=20)


@tool(args_schema=DocTypeSearchInput)
def vinfast_search_by_doctype(
    query: str,
    doc_types: list[DocType],
    top_k: int = TOP_K,
) -> str:
    """
    Tìm kiếm có lọc theo loại tài liệu (doc_type).

    Khi nào dùng:
    - Hỏi thông số kỹ thuật, giá xe → doc_types=['spec']
    - Hỏi FAQ chính thức từ VinFast → doc_types=['faq']
    - Hỏi kinh nghiệm thực tế từ chủ xe → doc_types=['forum_qa']
    - Hỏi trả góp, tài chính → doc_types=['installment']
    - Muốn so sánh cả FAQ lẫn thực tế → doc_types=['faq', 'forum_qa']
    """
    encoder = _get_encoder()
    vector = encoder.encode(query).tolist()
    qdrant_filter = _build_filter(doc_types=doc_types)

    hits = _get_qdrant().search(
        collection_name=COLLECTION,
        query_vector=vector,
        query_filter=qdrant_filter,
        limit=top_k,
        with_payload=True,
    )
    return _format_hits(hits)


# ══════════════════════════════════════════════════════════════════════════════
# Tool 3 — Search theo model xe + doc_type (kết hợp)
# ══════════════════════════════════════════════════════════════════════════════

class ModelDocSearchInput(BaseModel):
    query: str = Field(description="Câu hỏi cần tìm kiếm")
    models: list[ModelName] = Field(
        description=(
            "Dòng xe VinFast cần lọc. "
            "Chọn trong: 'VF 3', 'VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'all'. "
            "Tự động bao gồm doc có model='all' (áp dụng cho mọi xe)."
        )
    )
    doc_types: Optional[list[DocType]] = Field(
        default=None,
        description="Lọc thêm theo loại tài liệu (để trống = lấy tất cả)"
    )
    top_k: int = Field(default=TOP_K, ge=1, le=20)


@tool(args_schema=ModelDocSearchInput)
def vinfast_search_by_model(
    query: str,
    models: list[ModelName],
    doc_types: Optional[list[DocType]] = None,
    top_k: int = TOP_K,
) -> str:
    """
    Tìm kiếm thông tin về một dòng xe VinFast cụ thể.
    Tự động bao gồm các tài liệu chung (model='all').

    Ví dụ dùng:
    - 'VF 8 chạy được bao nhiêu km một lần sạc?' → models=['VF 8']
    - 'So sánh pin VF 6 và VF 7' → models=['VF 6', 'VF 7'], doc_types=['spec']
    - 'Chủ xe VF 9 nói gì về hành trình dài?' → models=['VF 9'], doc_types=['forum_qa']
    """
    encoder = _get_encoder()
    vector = encoder.encode(query).tolist()
    qdrant_filter = _build_filter(doc_types=doc_types, models=models)

    hits = _get_qdrant().search(
        collection_name=COLLECTION,
        query_vector=vector,
        query_filter=qdrant_filter,
        limit=top_k,
        with_payload=True,
    )
    return _format_hits(hits)


# ══════════════════════════════════════════════════════════════════════════════
# Export danh sách tools để dùng trong agent
# ══════════════════════════════════════════════════════════════════════════════

VINFAST_TOOLS = [
    vinfast_semantic_search,
    vinfast_search_by_doctype,
    vinfast_search_by_model,
]