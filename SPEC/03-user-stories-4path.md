# User stories — 4 paths

## 1. Feature: Tư vấn thông số xe VinFast và chính sách tài chính

**Trigger:** Khách hàng đặt câu hỏi về một dòng xe (Vd: "VF5 giá lăn bánh bao nhiêu và sạc bao lâu?")

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy** — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI lấy thông tin từ database chuẩn xác, phản hồi cấu hình, giá lăn bánh và chính sách sạc nhanh. Khách thích và để lại thông tin đặt cọc. |
| **Low-confidence** — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Câu hỏi quá ngắn ("VF5 sao?"). AI phản hồi: "Bạn muốn tìm hiểu về thông số kỹ thuật, giá bán hay ưu đãi trả góp của VF5? Xin hãy cho biết rõ hơn hoặc chọn kết nối Tư vấn viên." |
| **Failure** — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI báo giá sai. Khách thấy giá bị đắt hơn mình đọc trên báo. Khách hàng nhắn: "Sai rồi, giá thuê pin hiện chỉ còn 1.2tr". AI xin lỗi và hiển thị nút "Kết nối tư vấn viên" để xử lý khủng hoảng. |
| **Correction** — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Người dùng phản hồi "Thông tin sai", nhấn nút Dislike. Phản hồi này cùng context chat sẽ đẩy về đội duy trì Knowledge Base để cập nhật lại cơ sở dữ liệu (Database). |

## 2. Feature: Tính toán trả góp tự động bằng Function Calling

**Trigger:** Khách hàng nói: "Tôi muốn mua VF 6 Base, trả trước 30%, vay 5 năm, tính tiền hàng tháng."

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy** — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI bóc tách đủ (Model=VF6 Base, Trả trước=30%, Thời hạn=60 tháng), gọi tool tính. Hiển thị báo cáo trả góp tháng đầu. Khách thỏa mãn và xin liên hệ sale. |
| **Low-confidence** — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | "Tôi muốn mua xe trả góp gốc và lãi chia đều". AI không tự xác định được lãi suất của ngân hàng nào cụ thể nên phản hồi: "Bạn muốn vay qua ngân hàng nào, hay để AI áp dụng lãi suất ưu đãi hiện tại của VinFast (8%/năm)?" |
| **Failure** — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI tính ra số tiền đóng cực lớn do bắt nhầm entity (ví dụ trả trước 30 triệu thay vì 30%). Khách hoang mang. Dưới bảng tính có dòng "Lưu ý: Bảng tính chỉ mang tính tham khảo. Gặp Tư vấn viên". |
| **Correction** — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Khách bảo "Ý tôi là 30% giá xe cơ". AI tự sửa lỗi và parse lại parameter. Data log gọi tool sai được phân tích offline để cải thiện prompt cho LLM. |
