# Eval metrics + threshold

## Precision hay recall?
Trong project chatbot hỗ trợ khách hàng khi mua xe Vinfast này nhóm ưu tiên precision hơn

**Lý do**: Sản phẩm tư vấn **thông số xe** và **ước tính tài chính/trả góp** nếu có sai số hoặc sai policy sẽ làm mất niềm tin, có thể dẫn đến các rủi ro về pháp lý, thương mại, khiến khách ra quyết định sai. Nội dung kiến thức cho Chatbot bám vào tài liệu VinFast và disclaimer rõ, ưu tiên **đúng từng câu trả lời** hơn là cố trả lời mọi câu. **Nếu sai ngược lại thì sao?** Ưu tiên recall → AI trả lời dài, trả lời nhiều chủ đề nhưng dễ **hallucination** khiến khách tưởng đã đúng và không handoff kịp → hậu quả nặng hơn so với thiếu sót (vì đã có cơ chế trả lời không chắc hoặc chuyển tư vấn viên).

## Metrics table

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| Precision | ≥90% trên bộ test cố định | <85% |
| Like / Dislike — phản hồi explicit | ≥60% | <45% |
| Handoff rate sau câu trả lời | 15–35% | <10% (nghi ngờ AI tự tin sai) hoặc >50% (AI chưa có tác dụng)|
| Tỷ lệ hoàn tất để lại SĐT trên Happy path | ≥25%| Giảm >30% so với baseline hoặc <10% |


## Mở rộng

### User-facing metrics vs internal metrics

| Metric | User thấy? | Dùng để làm gì |
|--------|-----------|-----------------|
| Like / Dislike sau câu trả lời | ☑ Có ☐ Không | Thu tín hiệu học tập explicit; không cần show % aggregate cho user |
| Disclaimer bảng tính tài chính (tham khảo, tư vấn viên chốt) | ☑ Có ☐ Không | Luôn hiển thị khi có ước tính trả góp |
| Confidence score | ☐ Có ☑ Không | Internal: để quyết định luồng đi (Happy / Low-confidence / Failure). User thấy hành vi (làm rõ câu hỏi, handoff), không thấy score |
| Response latency | ☐ Có ☑ Không | Không show ms; nếu >3–5s sẽ có loading để không bỏ session |
| Handoff rate, correction rate | ☐ Có ☑ Không | Internal: chất lượng vận hành |

### Offline eval vs online eval

| Loại | Khi nào | Đo gì | Ví dụ |
|------|---------|-------|-------|
| **Offline** | Trước khi deploy / mỗi khi đổi RAG hoặc tool tính giá | Precision trên câu hỏi có đáp án chuẩn; kiểm tra tool trả góp với bảng giá/lãi mẫu | 100–200 câu: thông số xe, so sánh phiên bản, kịch bản trả góp cố định |
| **Online** | Sau khi deploy | Like/Dislike, handoff sau reply, hoàn tất SĐT Happy path, session length, hỏi lại cùng chủ đề | Theo dõi learning signal trong spec-draft |

- **Product** đang đo: explicit (Like/Dislike), implicit (handoff, độ dài session, lặp chủ đề), conversion SĐT Happy path. Cần bổ sung: **offline** gắn kiểm thử hồi quy tự động để đảm bảo Chatbot không quyên kiến thức cũ trước khi deploy bản release tiếp theo.

### A/B test design
| Tên thử nghiệm | Phiên bản A | Phiên bản B | Chỉ số đánh giá người thắng cuộc |
|---|---|---|---|
| 1. Luồng tính toán trả góp | Bot hỏi kỹ thông tin rồi mới tính toán | Bot tính nhẩm nhanh con số ước chừng, sau đó mới cho khách điều chỉnh | Tỷ lệ khách để lại SĐT xin tư vấn; Tỷ lệ khách đòi gặp Sale thật (càng thấp càng tốt). |
| 2. Hiển thị lời cảnh báo tham khảo | Cảnh báo bằng 1 dòng ngắn gọn | Cảnh báo chi tiết, nhấn mạnh \"Tư vấn viên thật sẽ chốt số cuối cùng\" | Tỷ lệ bấm Like câu trả lời; Số lượng câu hỏi vặn vẹo/tranh cãi lại bot. |

