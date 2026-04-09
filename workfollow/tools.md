# Danh sách Tools của VinFast AI Assistant (Vivi AI)

Tài liệu này mô tả chi tiết các tools (công cụ) mà AI Agent sử dụng trong quy trình hội thoại (workflow), bao gồm thời điểm kích hoạt, tham số đầu vào (input) và kết quả trả về (output).

---

## 1. get_car_info
- **Mục đích:** Tra cứu thông tin, thông số kỹ thuật, và giá xe VinFast.
- **Phase sử dụng:** `CAR_DISCOVERY` (Khi khách hàng đang tìm hiểu và chọn mẫu xe).
- **Input:**
  - `query` (string) [Bắt buộc]: Câu hỏi gốc của khách hàng để giữ ngữ cảnh.
  - `model` (string) [Tùy chọn]: Tên dòng xe (VD: "VF5", "VF 8").
  - `seats` (integer) [Tùy chọn]: Số chỗ ngồi yêu cầu.
  - `budget_max` (integer) [Tùy chọn]: Ngân sách tối đa tính bằng VND.
  - `body_style` (string) [Tùy chọn]: Kiểu dáng xe (VD: "SUV", "sedan").
- **Output:**
  - Chuỗi JSON danh sách các xe khớp với tiêu chí, bao gồm: giá cả, tầm hoạt động, pin, thời gian sạc, v.v. Nếu không có kết quả, trả về thông báo lỗi kèm hướng xử lý.

---

## 2. get_promotions
- **Mục đích:** Tính toán giá lăn bánh và liệt kê các chương trình khuyến mãi hiện hành.
- **Phase sử dụng:** `FINANCE_FULL_PAY` (Sau khi khách chọn mua thẳng một mẫu xe).
- **Input:**
  - `car_id` (string) [Bắt buộc]: Mã của loại xe (VD: "VF5_PLUS").
  - `region` (string) [Tùy chọn]: Khu vực đăng ký, default là "HAN". Các giá trị hợp lệ: "HAN" (Hà Nội), "SGN" (HCM), "PROVINCE" (Tỉnh khác).
- **Output:**
  - Chuỗi JSON chi tiết cấu thành giá lăn bánh (Giá nền, VAT, Thuế trước bạ, Phí ra biển, v.v.), tổng chi phí `total_on_road_vnd`, và các ghi chú khuyến mãi `promo_note`.

---

## 3. calculate_installment
- **Mục đích:** Tính toán lịch trả góp hàng tháng dựa trên phương pháp dư nợ giảm dần. Tool này là Deterministic (tính toán cứng), không dùng LLM để tự tính nhằm tránh sai sót.
- **Phase sử dụng:** `FINANCE_INSTALLMENT` (Khi khách hàng chọn phương thức trả góp và đã điền hoàn tất Form Slot Filling).
- **Input (Bắt buộc phải có đủ cả 4):**
  - `car_price` (integer): Giá niêm yết của xe (VND).
  - `down_payment_ratio` (float): Tỉ lệ trả trước (Ví dụ: 0.3 tương đương 30%).
  - `loan_term_months` (integer): Tổng thời gian vay tính bằng tháng (Ví dụ: 36, 60,...).
  - `annual_interest_rate` (float): Lãi suất vay theo năm (%).
- **Output:**
  - Chuỗi JSON cung cấp `summary` (tổng khoản vay, lãi phải trả), `schedule_preview` (bảng minh họa trả góp các tháng đầu), và cờ `warning` nếu số tiền trả góp hàng tháng cao bất thường (> 10% giá trị xe).

---

## 4. save_lead
- **Mục đích:** Thu thập số điện thoại, tên, và thông tin nhu cầu để lưu vào cơ sở dữ liệu, giúp nhân viên Sale có thể gọi lại chốt đơn hoặc tư vấn thêm.
- **Phase sử dụng:** `HANDOFF_COLLECT` (Khi khách hàng muốn chốt cọc, đăng ký lái thử, hoặc yêu cầu gặp người thật).
- **Input:**
  - `customer_phone` (string) [Bắt buộc]: Số điện thoại khách hàng.
  - `customer_name` (string) [Tùy chọn]: Tên khách hàng.
  - `selected_car_id` (string) [Tùy chọn]: Xe khách hàng đang quan tâm.
  - `finance_summary` (string) [Tùy chọn]: Tóm tắt thông tin tài chính đã trao đổi.
- **Output:**
  - Chuỗi JSON báo cáo kết quả: `success` (lưu thành công với `lead_id`) hoặc `error` nếu số điện thoại không vượt qua các cơ chế kiểm tra (VD: form không đủ 10 số, bắt đầu bằng số 0 của VN).
