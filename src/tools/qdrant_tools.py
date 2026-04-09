# test_agent.py
"""
Agent test tương tác CLI — dùng để kiểm tra 3 VinFast tools.

Chạy:
    python test_agent.py

Chế độ:
    1. Chat tự do  → agent tự chọn tool phù hợp
    2. Test nhanh  → chạy bộ câu hỏi mẫu bao phủ cả 3 tools
"""

import sys
import time
import textwrap

# ── LangChain / LangGraph ──────────────────────────────────────────────────────
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
# ── VinFast tools ─────────────────────────────────────────────────────────────
from qdrant_tools import VINFAST_TOOLS
# Bộ câu hỏi test — bao phủ cả 3 tools
# ══════════════════════════════════════════════════════════════════════════════

TEST_CASES = [
    ("🔍 Semantic search tổng quát",
     "VinFast có chính sách bảo hành pin như thế nào?",
     "vinfast_semantic_search"),

    ("📋 Filter doc_type=spec",
     "Thông số kỹ thuật động cơ VF 8 là bao nhiêu?",
     "vinfast_search_by_doctype"),

    ("❓ Filter doc_type=faq",
     "Câu hỏi thường gặp về sạc pin VinFast",
     "vinfast_search_by_doctype"),

    ("💬 Filter doc_type=forum_qa",
     "Chủ xe VF 6 phản hồi thực tế về pin thế nào?",
     "vinfast_search_by_doctype"),

    ("🚗 Filter theo model VF 8",
     "VF 8 chạy được bao nhiêu km một lần sạc đầy?",
     "vinfast_search_by_model"),

    ("⚡ Filter model + doc_type",
     "So sánh thông số pin VF 6 và VF 7",
     "vinfast_search_by_model"),

    ("💰 Trả góp",
     "Điều kiện mua xe VinFast trả góp là gì?",
     "vinfast_search_by_doctype"),
]

# ══════════════════════════════════════════════════════════════════════════════
# Khởi tạo agent
# ══════════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """Bạn là trợ lý tư vấn xe điện VinFast.
Luôn dùng tools để tìm thông tin trước khi trả lời. KHÔNG tự bịa số liệu.

Quy tắc chọn tool:
- Câu hỏi chung, không rõ xe/loại doc → vinfast_semantic_search
- Hỏi rõ loại tài liệu (thông số, FAQ, forum, trả góp) → vinfast_search_by_doctype
- Hỏi về xe cụ thể (VF 3, VF 8...) → vinfast_search_by_model

Trả lời ngắn gọn, chính xác bằng tiếng Việt. Ghi rõ nguồn (spec/faq/forum_qa)."""


def build_agent():
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    return create_react_agent(
        model=llm,
        tools=VINFAST_TOOLS,
        prompt=SYSTEM_PROMPT,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Helpers hiển thị
# ══════════════════════════════════════════════════════════════════════════════

SEP  = "═" * 65
SEP2 = "─" * 65


def print_header():
    print(f"\n{SEP}")
    print("  🚗  VINFAST RAG — TOOL TEST AGENT")
    print(f"{SEP}")
    print("  Tools có sẵn:")
    for t in VINFAST_TOOLS:
        print(f"    • {t.name}")
    print(SEP)


def parse_result(result: dict) -> tuple[str, list[str]]:
    """Trả về (answer, tools_used) từ kết quả LangGraph."""
    messages = result.get("messages", [])

    # Lấy câu trả lời cuối cùng
    answer = ""
    for msg in reversed(messages):
        if hasattr(msg, "content") and msg.content and msg.__class__.__name__ == "AIMessage":
            # Bỏ qua AIMessage chỉ có tool_calls, chưa có text
            if isinstance(msg.content, str) and msg.content.strip():
                answer = msg.content.strip()
                break

    # Lấy danh sách tools đã gọi
    tools_used = []
    for msg in messages:
        if msg.__class__.__name__ == "AIMessage" and hasattr(msg, "tool_calls"):
            for tc in (msg.tool_calls or []):
                tools_used.append(tc.get("name", ""))

    return answer, tools_used


def print_result(label: str, question: str, result: dict, elapsed: float):
    print(f"\n{SEP2}")
    if label:
        print(f"  {label}")
    print(f"  Q: {question}")
    print(SEP2)

    answer, tools_used = parse_result(result)

    if tools_used:
        for t in tools_used:
            print(f"  🔧 Tool dùng : {t}")
    else:
        print("  ⚠️  Không có tool nào được gọi")

    wrapped = textwrap.fill(answer or "(không có câu trả lời)",
                            width=62, initial_indent="  ", subsequent_indent="  ")
    print(f"\n  💬 Trả lời:\n{wrapped}")
    print(f"\n  ⏱  {elapsed:.2f}s")


# ══════════════════════════════════════════════════════════════════════════════
# Chế độ 1: Test nhanh bộ câu hỏi mẫu
# ══════════════════════════════════════════════════════════════════════════════

def run_quick_test(agent):
    print(f"\n{'═'*65}")
    print(f"  🧪  QUICK TEST — {len(TEST_CASES)} câu hỏi mẫu")
    print(f"{'═'*65}")

    passed = 0
    for i, (label, question, expected_tool) in enumerate(TEST_CASES, 1):
        print(f"\n[{i}/{len(TEST_CASES)}] Đang xử lý...")
        t0 = time.time()
        try:
            result = agent.invoke({"messages": [("human", question)]})
            elapsed = time.time() - t0

            _, tools_used = parse_result(result)
            match = expected_tool in tools_used
            status = "✅" if match else "⚠️ "
            if match:
                passed += 1

            print_result(f"{status} {label}", question, result, elapsed)
            if not match:
                print(f"  ⚠️  Tool dự kiến: {expected_tool} | Thực tế: {tools_used}")

        except Exception as e:
            print(f"  ❌ LỖI: {e}")

    print(f"\n{SEP}")
    print(f"  KẾT QUẢ: {passed}/{len(TEST_CASES)} tool đúng như dự kiến")
    print(SEP)


# ══════════════════════════════════════════════════════════════════════════════
# Chế độ 2: Chat tự do
# ══════════════════════════════════════════════════════════════════════════════

def run_chat(agent):
    print("\n  💬  CHAT MODE — Nhập câu hỏi (gõ 'exit' để thoát)\n")
    while True:
        try:
            question = input("  Bạn: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n  Thoát.")
            break

        if not question:
            continue
        if question.lower() in ("exit", "quit", "thoát"):
            print("  Tạm biệt! 👋")
            break

        t0 = time.time()
        try:
            result = agent.invoke({"messages": [("human", question)]})
            elapsed = time.time() - t0
            print_result("", question, result, elapsed)
        except Exception as e:
            print(f"  ❌ Lỗi: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print_header()

    print("\n  Chọn chế độ:")
    print("  [1] Quick test — chạy 7 câu hỏi mẫu tự động")
    print("  [2] Chat       — hỏi tự do")
    print("  [q] Thoát\n")

    choice = input("  Lựa chọn (1/2/q): ").strip()
    if choice == "q":
        sys.exit(0)

    print("\n  ⏳ Đang khởi tạo agent & load encoder...")
    agent = build_agent()
    print("  ✅ Sẵn sàng!\n")

    if choice == "1":
        run_quick_test(agent)
    else:
        run_chat(agent)


if __name__ == "__main__":
    main()
