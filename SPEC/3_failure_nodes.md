## 4. Top 3 Failure Modes (Trigger / Hậu quả / Mitigation)

### Chế độ lỗi: Ảo giác (Hallucination) về tính toán tài chính
- **Trigger**: Khách hàng đưa ra một kịch bản vay phức tạp (vay dư nợ giảm dần, ân hạn nợ gốc 6 tháng).
- **Hậu quả**: Đưa ra con số sai lệch, khách hàng kỳ vọng sai, gây phẫn nộ và khủng hoảng truyền thông (PR crisis), có rủi ro pháp lý.
- **Mitigation (Khắc phục)**: Tuyệt đối không dùng LLM để tự làm toán sinh chữ. Sử dụng LLM làm cổng giao tiếp để bóc tách tham số (Intent, Số tiền, Thời hạn) -> Chuyền tham số vào một API/Tool Python chạy bằng công thức toán học chuẩn -> LLM đọc kết quả API và trả lời khách.

### Chế độ lỗi: Phản hồi thông tin lỗi thời
- **Trigger**: Vinfast vừa đổi chính sách giá hoặc cập nhật phần mềm xe nhưng cơ sở dữ liệu của Bot chưa được update.
- **Hậu quả**: Tư vấn sai giá, báo sai chương trình khuyến mãi.
- **Mitigation**: Các dữ liệu động (giá xe, khuyến mãi, lãi suất) không lưu trong Vector Database dạng text tĩnh, mà phải được truy xuất Real-time (thời gian thực) từ Database chính của Vinfast khi có truy vấn.

### Chế độ lỗi: Bị tấn công Jailbreak/Prompt Injection
- **Trigger**: User cố tình ép bot chửi bậy, nói xấu Vinfast, hoặc làm thơ khen đối thủ.
- **Hậu quả**: Ảnh hưởng nghiêm trọng đến hình ảnh thương hiệu.
- **Mitigation**: Có một lớp AI Guardrail (hoặc Prompt phân loại) đứng trước để chặn các câu hỏi độc hại, OOD (Out of domain) trước khi đưa vào luồng xử lý chính.
