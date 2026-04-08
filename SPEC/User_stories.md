## User Stories × 4 paths

### Happy Path (Lý tưởng)
- **User**: "Mình muốn mua VF 8, trả trước 30% thì mỗi tháng trả bao nhiêu trong 3 năm?"
- **AI**:
  - Trích xuất đúng giá VF 8 hiện tại.
  - Gọi hàm tính toán khoản vay (trả trước 30%, kỳ hạn 36 tháng) để ra số tiền trả mỗi tháng.
  - Trả lời con số mỗi tháng kèm thông số cơ bản của VF 8.
  - Hỏi thêm khách có muốn đăng ký lái thử không.
- **User**: Để lại SĐT.

### Low-confidence Path (Độ tự tin thấp / Thiếu thông tin)
- **User**: "Xe điện loại rẻ nhất trả góp thế nào?"
- **AI**:
  - Nêu các dòng xe phân khúc phổ thông hiện tại như VF 3 và VF 5.
  - Hỏi ngược lại để làm rõ intention: “Bạn đang quan tâm mẫu nào để mình tính toán chi phí trả góp chi tiết giúp bạn nhé?”

### Failure Path (Thất bại / Vượt phạm vi)
- **User**: "Xe VF 8 chạy có hay bị lỗi như báo chí nói không? So với xe Toyota thì thế nào?"
- **AI**:
  - Phát hiện câu hỏi nhạy cảm/ngoài luồng (out-of-domain).
  - Trả lời theo phạm vi cho phép: “Xin lỗi bạn, mình là trợ lý ảo hỗ trợ thông tin xe và tài chính của VinFast. Mình xin phép chia sẻ ưu điểm của VF 8 là...”
  - Đề nghị chuyển tuyến: “Bạn có muốn mình nối máy với chuyên viên để giải đáp các thắc mắc chuyên sâu hơn không?”

### Correction Path (Hiệu chỉnh)
- **User**: "Pin xe này đi được bao xa?" (AI hiểu nhầm đang hỏi VF 9 do context câu trước, trả lời thông số VF 9).
- **User**: "Không, ý mình là chiếc VF 6 cơ."
- **AI**:
  - Xin lỗi vì sự nhầm lẫn.
  - Trả lại đúng thông tin cho VF 6: “Quãng đường di chuyển của VF 6 sau mỗi lần sạc đầy là khoảng 399km (theo chuẩn WLTP)...”
