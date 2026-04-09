# Hướng Dẫn Thiết Kế Dữ Liệu Tài Chính & Thông Tin Xe (Sau Khi Bỏ Bài Toán Thuê Pin)

## Tổng Quan

Việc bỏ qua bài toán **"Thuê pin vs Mua pin"** là một quyết định giúp "giảm tải" cực kỳ lớn cho backend và logic của AI. Thay vì phải xử lý ma trận tổ hợp `(Dòng xe × Tùy chọn pin × Số km di chuyển)`, luồng tính toán tài chính trở nên **tuyến tính và an toàn hơn** rất nhiều.

---

## 1. Cụm Dữ Liệu Tài Chính (Sau Khi Bỏ Thuê Pin)

> Bảng `Battery_Subscription` bị **loại bỏ hoàn toàn**. Bảng giá xe cũng được đơn giản hóa tương ứng.

---

### Bảng 1: `Vehicle_Price` — Giá Niêm Yết Duy Nhất

Không còn phân biệt giá có pin / không pin.

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ví Dụ |
|---|---|---|---|
| `car_id` | VARCHAR(50) — **PK** | Mã định danh duy nhất của phiên bản xe | `VF5_PLUS` |
| `model_name` | VARCHAR(100) | Tên hiển thị của dòng xe | `VF 5 Plus` |
| `retail_price` | BIGINT | Giá niêm yết (đã bao gồm pin) | `548,000,000` |
| `effective_date` | DATE | Ngày áp dụng mức giá | `2024-01-01` |

---

### Bảng 2: `Location_Tax_Fee` — Phí Theo Khu Vực

Bắt buộc phải có để tính **giá lăn bánh thực tế** (On-road price).

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ví Dụ |
|---|---|---|---|
| `location_id` | VARCHAR(20) — **PK** | Mã khu vực địa lý | `HAN`, `SGN`, `PROVINCE` |
| `registration_tax_rate` | DECIMAL(5,4) | Lệ phí trước bạ (xe điện hiện tại là 0%) | `0.00` |
| `plate_fee` | BIGINT | Phí biển số (20tr ở HN/HCM, 1tr ở tỉnh) | `20,000,000` |
| `inspection_fee` | BIGINT | Phí đăng kiểm | — |
| `road_usage_fee` | BIGINT | Phí sử dụng đường bộ | — |
| `insurance_civil` | BIGINT | Bảo hiểm trách nhiệm dân sự | — |

---

### Bảng 3: `Bank_Loan_Policy` — Chính Sách Vay Ngân Hàng

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ví Dụ |
|---|---|---|---|
| `bank_id` | VARCHAR(20) — **PK** | Mã ngân hàng | `VCB`, `BIDV` |
| `max_loan_percentage` | DECIMAL(5,2) | Tỷ lệ vay tối đa trên giá trị xe | `80%` |
| `interest_rate_promo` | DECIMAL(5,2) | Lãi suất ưu đãi (năm đầu) | — |
| `max_term_months` | INTEGER | Số tháng vay tối đa | — |

---

### Thay Đổi Ở Tool API

Tham số gọi Tool của AI giờ **gọn nhẹ hơn rất nhiều** — đã loại bỏ `battery_plan` và `estimated_km_per_month`:

```json
{
  "tool": "calculate_financial_plan",
  "parameters": {
    "car_model": "VF_5",
    "location": "HAN",
    "bank_id": "BIDV",
    "down_payment_percent": 0.20
  }
}
```

---

## 2. Cụm Dữ Liệu Thông Tin Xe — `Vehicle_Meta`

### Cấu Trúc Bảng Chính

| Tên Cột | Kiểu Dữ Liệu | Mô Tả | Ví Dụ (VF 8 Plus) |
|---|---|---|---|
| `car_id` | VARCHAR(50) — **PK** | Mã định danh duy nhất. Dùng để JOIN với bảng Giá | `VF8_PLUS` |
| `model_series` | VARCHAR(50) | Tên dòng xe gốc. Dùng để gom nhóm khi khách hỏi chung chung | `VF 8` |
| `retail_price` | VARCHAR(50) | Giá của dòng xe (đã bao gồm pin) | `548,000,000` |
| `trim_level` | VARCHAR(50) | Phiên bản (Eco, Plus, Base...) | `Plus` |
| `body_style` | VARCHAR(50) | Kiểu dáng xe. Dùng khi khách lọc theo loại | `D-SUV` |
| `seats` | INTEGER | Số chỗ ngồi — **bộ lọc cực kỳ phổ biến** của khách hàng | `5` |
| `range_wltp_km` | INTEGER | Quãng đường tối đa theo chuẩn WLTP (km) — tiêu chí cốt lõi xe điện | `471` |
| `battery_capacity` | DECIMAL(5,2) | Dung lượng pin khả dụng (kWh) | `87.7` |
| `drivetrain` | VARCHAR(20) | Hệ dẫn động. Dùng khi khách hỏi "xe mấy cầu" | `AWD` |
| `is_active` | BOOLEAN | Trạng thái xe còn kinh doanh hay không | `TRUE` |
| `detailed_specs` | JSONB | **Cột quan trọng nhất**: Lưu toàn bộ thông số kỹ thuật còn lại dưới dạng JSON | *(xem bên dưới)* |

### Ghi Chú Về Cột `detailed_specs`

Cột `detailed_specs` kiểu `JSONB` đóng vai trò là **kho lưu trữ linh hoạt** cho mọi thông số kỹ thuật không được chuẩn hóa thành cột riêng. Điều này giúp schema chính luôn gọn gàng trong khi vẫn đủ khả năng mở rộng khi VinFast bổ sung thông số mới cho các dòng xe tương lai.