## 6. Mini AI Spec (1 trang)

### Tên sản phẩm
**VinFast Sales & Finance Virtual Assistant**

### Problem (Vấn đề)
Khách hàng mất thời gian chờ đợi để nhận tư vấn cơ bản về xe và tính toán các kịch bản tài chính (trả trước/kỳ hạn/lãi suất/phương thức trả), dẫn tới:
- rớt lead (mất khách trong “thời điểm vàng”)
- trải nghiệm không nhất quán (tuỳ chất lượng tư vấn viên)
- tăng tải cho Sales/CSKH, đặc biệt ngoài giờ

### Goal (Mục tiêu)
- **Cung cấp thông tin xe (specs) chính xác** và nhất quán từ nguồn chính thức.
- **Báo giá/tính toán trả góp tức thì 24/7** (mang tính tham khảo), kèm giả định đầu vào rõ ràng.
- **Tối ưu chuyển đổi lead**: khuyến khích đặt lịch lái thử/để lại SĐT ở cuối câu trả lời phù hợp ngữ cảnh.

### Non-goals (Không làm trong MVP)
- Không tranh luận/so sánh nhạy cảm với hãng khác, tin đồn báo chí (ưu tiên điều hướng + handoff).
- Không “chốt deal” tài chính cuối cùng (con số cuối do tư vấn viên/đối tác xác nhận).
- Không để LLM tự tính toán số tiền trả góp (mọi con số tiền/giá phải ra từ tool/API).

### Core User Flow (Luồng người dùng cốt lõi)
1) **User** nhập câu hỏi (Text/Voice).
2) **Classifier** xác định Intent:
   - **Xe** (specs/tính năng/so sánh các dòng xe VinFast trong phạm vi)
   - **Tài chính** (trả góp/vay/ước tính hàng tháng)
   - **OOD / nhạy cảm** (ngoài phạm vi, jailbreak, prompt injection)
3a) Nếu **Xe** → **RAG Retrieval** (truy xuất tài liệu/cấu phần tri thức phù hợp)  
3b) Nếu **Tài chính** → **Tool/Function Calling**:
   - gọi **API giá/khuyến mãi** (nếu có) để lấy giá tham chiếu mới nhất
   - gọi **API tính toán trả góp/vay** để ra con số (không để LLM tự tính)
3c) Nếu **OOD/nhạy cảm** → **Guardrail** chặn/điều hướng + đề nghị **human handoff**
4) **LLM** tổng hợp câu trả lời theo định dạng chuẩn (rõ ràng, có bảng/đầu dòng), kèm:
   - nêu **nguồn** (trích dẫn/đường dẫn nội bộ nếu có)
   - nêu **giả định đầu vào** (giá, trả trước, kỳ hạn, lãi suất tham chiếu, phí nếu có)
   - disclaimer tài chính: “**Bảng tính mang tính tham khảo, tư vấn viên sẽ chốt con số cuối cùng.**”
5) **Trả kết quả + CTA**:
   - “Bạn muốn **đặt lịch lái thử** hay **để lại SĐT** để tư vấn viên liên hệ?”

### Input/Output chuẩn (để giảm sai và tăng conversion)
- **Input tối thiểu cho tài chính**: mẫu xe/phiên bản, trả trước (% hoặc số tiền), kỳ hạn (tháng), (tuỳ chọn) lãi suất tham chiếu/ngân hàng.
- **Nếu thiếu thông tin**: hỏi làm rõ theo “low-confidence path” (không phỏng đoán).
- **Output tài chính**: tóm tắt 1 màn hình, ưu tiên:
  - Giá tham chiếu, số tiền vay, kỳ hạn, lãi suất tham chiếu
  - Ước tính trả hàng tháng (và/hoặc bảng tóm tắt)
  - Gợi ý bước tiếp theo (CTA)

### Technical Requirements (Yêu cầu kỹ thuật)
#### Mô hình cốt lõi
- LLM tối ưu tiếng Việt, **RAG tốt**, **Function Calling** ổn định.

#### Kiến trúc
- **RAG System**
  - Vector DB chứa: catalog xe, cẩm nang người dùng, FAQ/chính sách bán hàng (bản chuẩn hoá).
  - Pipeline ingest có versioning + lịch cập nhật.
- **External Tools/APIs**
  - API giá xe/khuyến mãi VinFast (ưu tiên realtime hoặc update theo giờ/ngày)
  - API lãi suất ngân hàng đối tác (Vietcombank, Techcombank, …)
  - API tính toán trả góp/vay (chuẩn hoá công thức, deterministic)
- **Analytics/Logging**
  - log intent, tool-call success/fail, latency, handoff, lead submit, feedback like/dislike

#### Độ trễ (Latency SLO)
- < **3 giây** cho câu hỏi thường (xe/FAQ).
- < **5 giây** cho câu hỏi có gọi API tính toán.

### Data Sources (Nguồn dữ liệu)
- Thông số kỹ thuật xe **VF 3 → VF 9** (theo nguồn chính thức)
- Cẩm nang người dùng/HDSD
- Bảng giá xe (update)
- Bảng lãi suất ngân hàng (update)
- Kịch bản chốt sale chuẩn của VinFast (CTA/đề xuất bước tiếp theo)

### Trust & Safety (Tin cậy và an toàn)
- **Không tự bịa số**: mọi số tiền/giá → bắt buộc từ tool/API; nếu tool lỗi → trả lời “chưa thể tính lúc này” + handoff.
- **Chống thông tin lỗi thời**: dữ liệu động (giá/khuyến mãi/lãi suất) truy xuất realtime hoặc có TTL ngắn.
- **Chống jailbreak/prompt injection**: lớp guardrail trước luồng chính, chặn nội dung độc hại/OOD.
- **Minh bạch**: luôn nói rõ đây là trợ lý ảo; có disclaimer tài chính.

### Eval Metrics (Chỉ số đánh giá – mục tiêu)
(tham chiếu `SPEC/eval_metrics..md`)
- **Task Success Rate**: mục tiêu **> 85%** (đúng tác vụ: trả đúng spec / tính đúng bảng trả góp).
- **Hallucination Rate**: mục tiêu **< 5%**; sai liên quan **giá/tiền** coi là red flag.
- **Human Handoff Rate**: mục tiêu **< 20%** khi scale (pilot có thể cao hơn).
- **Lead conversion (proxy)**: tỷ lệ để lại SĐT/đặt lịch lái thử tăng theo kênh (đo A/B nếu có).

### UX/Channel (Giao diện & kênh triển khai)
- Tích hợp trực tiếp:
  - **Webchat** trên `vinfast.vn`
  - **Zalo OA**
- Hỗ trợ Text trước, Voice là mở rộng (nếu có ASR/TTS phù hợp).

### Rollout đề xuất (ngắn gọn)
- **Pilot**: 2–4 tuần, khoanh phạm vi intent (Xe + Tài chính tham khảo), bật logging/feedback.
- **Mở rộng**: tăng coverage dữ liệu + tối ưu guardrail + giảm handoff + tối ưu CTA.