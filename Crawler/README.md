# 🚗 VinFast Data Crawler & RAG Pipeline

Hệ thống thu thập và xử lý dữ liệu xe điện VinFast từ nhiều nguồn, phục vụ cho chatbot tư vấn tự động (RAG - Retrieval Augmented Generation).

## ✨ Chức năng chính

- **Crawl dữ liệu** từ website chính thức VinFast và cộng đồng người dùng
- **Parse & trích xuất** thông số kỹ thuật, giá xe, chính sách tài chính
- **Lưu trữ** vào SQLite database có cấu trúc
- **Xử lý & chunking** văn bản để tạo embedding vectors
- **Index lên Qdrant** vector database cho hệ thống RAG

## 🔄 Workflow hoạt động

```
┌─────────────────┐
│ 1. Crawl Data   │  Playwright + HTTP scraping
│   • vinfastauto.com (chính thức)
│   • vinfast.vn (cộng đồng)
└────────┬────────┘
         │
┌────────▼────────┐
│ 2. Parse & Save │  Regex extraction + SQLite storage
│   • Giá xe từng phiên bản
│   • Thông số kỹ thuật
│   • Chính sách ngân hàng
│   • Phí trước bạ theo tỉnh
└────────┬────────┘
         │
┌────────▼────────┐
│ 3. Chunk Text   │  Sliding window với overlap
│   • Split thành chunks 400 từ
│   • Gán metadata (model, doc_type, category)
└────────┬────────┘
         │
┌────────▼────────┐
│ 4. Embed & Store│  Sentence Transformers + Qdrant
│   • Tạo vectors bằng Vietnamese Bi-Encoder
│   • Upsert vào Qdrant collection
└─────────────────┘
```

## 📁 Cấu trúc project

```
Crawler/
├── pipeline.py                 # Main orchestrator - chạy toàn bộ pipeline
├── db.py                       # Utility xem database (display tool)
├── data_last_version.py        # Crawler chính + Database management
├── fill_NaN.py                 # Bổ sung thông số kỹ thuật bị thiếu
├── requirements.txt            # Dependencies
├── vinfast.db                  # SQLite database (auto-generated)
│
├── crawlers/
│   ├── vinfastauto_crawler.py  # Crawler website chính thức (PRIMARY)
│   ├── vinauto_crawl_v1.py     # Version cũ (LEGACY - không dùng)
│   └── community_crawler.py    # Crawler diễn đàn cộng đồng
│
└── parsers/
    └── metadata_builder.py     # Chunking + metadata cho RAG
```

## 🚀 Cách vận hành

### Cài đặt dependencies

```bash
pip install -r requirements.txt
```

Cài Playwright browsers:
```bash
playwright install chromium
```

### Chạy toàn bộ pipeline (khuyên dùng)

```bash
python pipeline.py
```

**Luồng chạy:**
1. Crawl dữ liệu từ vinfastauto.com và vinfast.vn
2. Chunk text và tạo metadata
3. Tạo embeddings với Vietnamese Bi-Encoder
4. Index lên Qdrant (cần Qdrant chạy trên localhost:7333)

### Chạy riêng crawler + database

```bash
python data_last_version.py
```

**Luồng chạy:**
1. Khởi tạo database với schema đầy đủ
2. Crawl vinfastauto.com
3. Lưu vào SQLite (Vehicle_Price, Vehicle_Details, Bank_Loan_Policy, Location_Tax_Fee)
4. Hiển thị dữ liệu đã crawl

### Bổ sung thông số kỹ thuật

```bash
python fill_NaN.py
```

Điền range pin và dung lượng battery cho các xe chưa có dữ liệu.

### Xem database

```bash
python db.py
```

Hiển thị toàn bộ dữ liệu trong vinfast.db dưới dạng bảng.

## 💾 Database Schema

### Vehicle_Price
Giá niêm yết từng phiên bản (đã bao gồm pin)

### Vehicle_Details
Thông số kỹ thuật: kích thước, động cơ, pin, ADAS, tính năng

### Bank_Loan_Policy
Chính sách vay từ 7 ngân hàng (Vietcombank, BIDV, Techcombank, v.v.)

### Location_Tax_Fee
Phí trước bạ, biển số, bảo hiểm theo 6 khu vực

## ⚙️ Yêu cầu hệ thống

- Python 3.10+
- Qdrant server (cho pipeline hoàn chỉnh)
- Playwright Chromium
- Kết nối Internet để crawl dữ liệu

## 📝 Lưu ý quan trọng

- Giá xe và thông số được cập nhật theo thời điểm crawl
- Dữ liệu mang tính tham khảo, cần xác nhận từ tư vấn viên
- Community crawler có thể thất bại nếu diễn đàn thay đổi cấu trúc
- Qdrant phải chạy sẵn trên localhost:7333 trước khi chạy pipeline
