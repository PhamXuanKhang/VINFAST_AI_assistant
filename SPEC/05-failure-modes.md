# Top 3 failure modes — VinFast AI Assistant

Phần này được suy ra từ:
- 02 (Canvas): Trust + Feasibility
- 03 (4 paths): Failure path + Low-confidence path + Correction path
- 04 (Eval): ưu tiên precision cho thông tin tài chính/chính sách, có threshold và red flag

## Top 3 failure modes

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | User hỏi tài chính hoặc ưu đãi cụ thể (trả trước, trả góp, lãi suất), nhưng dữ liệu thiếu/cũ; AI vẫn trả lời số rất tự tin | User tin con số sai, kỳ vọng sai khi gặp Sales, giảm trust và có rủi ro khiếu nại | Chỉ cho phép trả lời số bằng tool tính toán + nguồn dữ liệu đã kiểm duyệt. Bắt buộc hiển thị thời điểm cập nhật và disclaimer "tham khảo". Nếu thiếu dữ liệu thì chuyển Low-confidence hoặc handoff, không đoán |
| 2 | Câu hỏi mơ hồ kiểu "xe điện rẻ nhất trả góp thế nào" nhưng AI không hỏi lại thông tin đầu vào (mẫu xe, trả trước, kỳ hạn) và đưa luôn 1 phương án | Gợi ý sai nhu cầu, user phải hỏi lại nhiều lần, tăng tỉ lệ rời phiên hoặc chuyển người thật quá sớm | Thiết kế flow hỏi làm rõ bắt buộc (slot filling) trước khi tính. Chỉ trả kết quả khi đủ biến đầu vào; nếu thiếu thì đưa 2-3 lựa chọn có giả định rõ và cho user chọn |
| 3 | User hỏi ngoài phạm vi hoặc cố tình prompt injection (so sánh hãng khác, tin đồn báo chí, ép bot bỏ quy tắc) | AI hallucinate hoặc trả lời vượt phạm vi, gây sai lệch thông tin và ảnh hưởng thương hiệu | Áp guardrail phạm vi domain VinFast + policy filter. Retrieval-only cho thông tin nhạy cảm. Câu hỏi ngoài scope phải từ chối lịch sự và chuyển tư vấn viên |

## Vì sao chọn 3 failure này (logic ưu tiên)

| Failure mode | Severity | Likelihood | Lý do ưu tiên |
|--------------|----------|------------|---------------|
| #1 Sai số tài chính/chính sách nhưng tự tin cao | Cao | Trung bình-cao | Đây là failure user khó phát hiện ngay, tác động trực tiếp đến quyết định mua và niềm tin |
| #2 Trả lời mơ hồ không hỏi làm rõ | Trung bình-cao | Cao | Xuất hiện thường xuyên ở hội thoại thực tế, làm giảm chất lượng toàn bộ funnel tư vấn |
| #3 Out-of-scope/injection | Cao | Trung bình | Tần suất có thể thấp hơn #2 nhưng hậu quả thương hiệu và độ tin cậy cao |

## Red flags theo phần 04 (để theo dõi sau khi chạy)

| Metric | Threshold đề xuất | Red flag |
|--------|-------------------|----------|
| Precision cho câu trả lời tài chính/chính sách | >= 95% | < 90% trong 1 tuần |
| Tỉ lệ phiên phải hỏi lại do trả lời mơ hồ | <= 20% | > 35% trong 1 tuần |
| Out-of-scope accuracy (từ chối/chuyển đúng) | >= 98% | < 95% trong 1 tuần |
| Handoff rate sau câu trả lời AI | 20-40% (mục tiêu giai đoạn đầu) | > 55% kèm dislike tăng |

## Liên kết 4 paths (phần 03) vào mitigation

- Happy: chỉ trả lời khi có đủ dữ liệu và nguồn tin cậy.
- Low-confidence: chủ động báo không chắc, yêu cầu thêm thông tin hoặc handoff.
- Failure: luôn có cơ chế user báo sai nhanh (dislike, "sai rồi", nút chuyển người thật).
- Correction: log chỉnh sửa của user để cập nhật tri thức và cải thiện rule/tool ở vòng sau.
