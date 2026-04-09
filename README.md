# VinFast AI Assistant — Vifa AI

Dự án Vifa AI là hệ thống Agentic Chatbot thông minh tư vấn xe điện VinFast, bao gồm:
- **Backend:** FastAPI cung cấp API, giao tiếp với LLM (OpenAI/Gemini) và database SQLite.
- **Frontend:** Next.js (React) với Tailwind CSS cung cấp giao diện chat widget hiện đại.

---

## 🛠 Yêu cầu hệ thống

- **Python:** 3.9 trở lên (khuyên dùng 3.10/3.11)
- **Node.js:** 18.x trở lên
- **npm** (được cài mặc định kèm Node.js)

---

## 🚀 Hướng dẫn cài đặt & chạy dự án

### 1. Cài đặt Backend (Python)

Từ thư mục gốc dự án, cài đặt các thư viện Python cần thiết:

```bash
pip install -r requirements.txt
```

Cấu hình biến môi trường:
- Copy file `.env.example` và đổi tên thành `.env`
- Mở file `.env` và cập nhật khóa API của bạn (ví dụ: `OPENAI_API_KEY`)

Khởi tạo cơ sở dữ liệu (nếu chưa có):
- Cơ sở dữ liệu mặc định là SQLite và được đặt tại `data/vinfast.db`.
- Nếu file DB chưa tồn tại hoặc bạn muốn làm mới dữ liệu, chạy lệnh sau:
```bash
python data/db_init.py
```

Chạy server Backend:
```bash
python server.py
```
> **Backend Server** sẽ chạy tại `http://localhost:8000`. Bạn có thể truy cập `http://localhost:8000/docs` để xem tài liệu API (Swagger UI).

### 2. Cài đặt Frontend (Next.js)

Mở một cửa sổ Terminal khác, di chuyển vào thư mục `frontend`:

```bash
cd frontend
npm install
```

Sau khi quá trình cài đặt hoàn tất, chạy server Frontend ở chế độ development:
```bash
npm run dev
```

> **Frontend Server** sẽ chạy tại `http://localhost:3000`. Mở trình duyệt và truy cập url này để sử dụng giao diện Chatbot.

---

## 📂 Kiến trúc Thư mục

- `server.py`: Điểm bắt đầu (entry point) của Backend FastAPI.
- `app.py`: Ứng dụng Streamlit (dùng cho test/demo nếu cần).
- `requirements.txt`: Các dependencies cho ứng dụng Python.
- `data/`: Chứa file cơ sở dữ liệu SQLite (`vinfast.db`) và script khởi tạo (`db_init.py`).
- `src/`: Mã nguồn của Backend bao gồm Agent logic, tools, core queries...
- `frontend/`: Mã nguồn của Frontend Next.js (components, tailwind config, v.v).
- `workfollow/` & `SPEC/`: Chứa các file và thông tin về luồng, specs, documents tham khảo.
- `.env`: File cấu hình môi trường chứa keys và configs.

---

## 🧪 Testing

Để kiểm tra nhanh logic hoặc kết nối trước khi chạy frontend, bạn có thể chạy:
```bash
pytest tests/
# hoặc chạy file test nhanh bằng script có sẵn
python test_quick.py
```
