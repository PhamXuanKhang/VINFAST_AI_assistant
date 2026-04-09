# ROI 3 kịch bản
---
## ROI: Chatbot tư vấn mua xe VinFast + tính trả góp (nhóm)

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | 100 lead/ngày qua chat; 40% dùng thường xuyên; 20% yêu cầu tính trả góp; tỷ lệ để lại SĐT sau chat 10% | 300 lead/ngày; 60% dùng thường xuyên; 30% yêu cầu tính trả góp; tỷ lệ để lại SĐT 20% | 700 lead/ngày; 75% dùng thường xuyên; 40% yêu cầu tính trả góp; tỷ lệ để lại SĐT 30% |
| **Cost** | Inference + tool calls: ~$15/ngày; Infra (hosting/DB/logs): ~$10/ngày; Maintain/monitor: 3 giờ/tuần | Inference + tool calls: ~$40/ngày; Infra: ~$20/ngày; Maintain/monitor: 6 giờ/tuần | Inference + tool calls: ~$90/ngày; Infra: ~$35/ngày; Maintain/monitor: 10 giờ/tuần |
| **Benefit** | Giảm tải FAQ 20% (một phần trong mục tiêu 40–50%); tiết kiệm ~1–2 FTE CSKH/Sales time; tăng lead capture +0–2 điểm % nhờ phản hồi 24/7 | Giảm tải FAQ 40%; tiết kiệm ~2–4 FTE time; tăng lead capture +3–5 điểm % (SĐT) nhờ bảng tính trả góp tức thì | Giảm tải FAQ 50%; tiết kiệm ~4–7 FTE time; tăng lead capture +6–8 điểm %; rút ngắn time-to-first-response gần 0 |
| **Net** | Dương nếu chỉ cần “bù” được ~1 giờ nhân sự/ngày hoặc +5–10 lead/tháng; âm nếu adoption thấp + handoff quá cao | Dương rõ rệt nếu đạt 40% giảm tải và lead capture tăng ≥3 điểm %; hoàn vốn nhanh nhờ giảm thời gian tính thủ công | Dương rất lớn nếu giữ được trust (precision) và conversion tăng; lợi ích tăng theo quy mô traffic |

**Kill criteria:** Like/Dislike <45% trong 2 tuần **hoặc** handoff rate >50% trong 2 tuần **hoặc** tỷ lệ để lại SĐT trên Happy path <10% sau 1 tháng **hoặc** phát hiện lỗi nghiêm trọng về thông số, giá hoặc tài chính gây mất trust.

---
### Cost breakdown chi tiết

| Hạng mục | Cách tính | Ước lượng |
|----------|-----------|-----------|
| API inference | chi phí/call × số call/ngày | ~ $15–$90/ngày |
| Tool/function calling | số lần tính trả góp + truy xuất dữ liệu × chi phí | ~ $5–$40/ngày |
| Infrastructure (hosting, DB, logs) | hosting + DB + lưu log/trace | ~ $10–$35/ngày |
| Nhân lực maintain/monitor | giờ/tuần × đơn giá (PM/Eng/CS) | 3–10 giờ/tuần |
| **Tổng cost/ngày** | (API + tool + infra) + (nhân lực/7) | xấp xỉ $30–$180/ngày |

### Benefit

| Benefit | Đo bằng gì | Tại sao quan trọng |
|---------|-----------|-------------------|
| Trải nghiệm tư vấn 24/7 tốt hơn | Like/Dislike, CSAT, time-to-first-response | Giảm bounce, tăng khả năng để lại SĐT |
| Minh bạch và tin cậy | tỷ lệ hỏi lại cùng chủ đề, số dispute “bot nói sai” | Trust là điều kiện để chuyển đổi lead |
| Data thu được từ hội thoại | correction rate, truy vấn phổ biến theo mẫu | Làm rõ nhu cầu thật, cải thiện RAG và nội dung |
| Chuẩn hoá tư vấn | variance câu trả lời giữa các kênh | Giảm sai lệch thông tin giữa Sales/CS |

### Time-to-value

Tuần 1-2: Onboarding, user học cách dùng → chưa thấy benefit rõ
Tuần 3-4: User quen → bắt đầu tiết kiệm thời gian
Tuần 5 trở đi:  Data flywheel kick in → AI chính xác hơn → benefit tăng dần

### Competitive moat

**Product của nhóm thuộc loại** có **moat mức vừa** nếu triển khai đúng:

- **Data unique có thể tích luỹ**: lịch sử hội thoại thật của khách quan tâm xe VinFast (intent, pain points, câu hỏi lặp theo từng dòng xe, phiên bản), các lần user chỉnh thông tin khi tính trả góp, và tín hiệu explicit/implicit (Like/Dislike, handoff, hỏi lại cùng chủ đề). Đây là dữ liệu unique gắn với kênh VinFast nên đối thủ khó có được y hệt.
- **Moat tăng mạnh nếu có integration**: kết nối lead pipeline, tracking chat → để lại SĐT → tư vấn viên chốt, và cập nhật tài liệu, giá và ưu đãi nội bộ theo thời gian. Khi đó tối ưu được cả chất lượng tư vấn lẫn chuyển đổi, không chỉ là chatbot trả lời.
- **Không phải moat mạnh nếu chỉ là LLM + FAQ tĩnh**: competitor có thể copy nhanh. Vì vậy cần tập trung vào data flywheel và quy trình cập nhật nguồn tin + audit để giữ **trust** (precision) và conversion.
```