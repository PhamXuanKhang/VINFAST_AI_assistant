## 3. Eval Metrics (Chỉ số đánh giá)

### Task Success Rate (Tỷ lệ hoàn thành tác vụ)
- Ví dụ như cung cấp đúng giá hoặc xuất ra bảng tính trả góp.
- **Threshold (Mục tiêu)**: > 85%.
- **Red flag (Báo động đỏ)**: < 70%.

### Hallucination Rate (Tỷ lệ ảo giác)
- Đặc biệt nghiêm trọng với thông số kỹ thuật xe và lãi suất ngân hàng.
- **Threshold**: < 5%.
- **Red flag**: > 10% (Hoặc bất kỳ lỗi sai nào liên quan đến giá tiền đều phải coi là Red Flag).

### Human Handoff Rate (Tỷ lệ chuyển giao cho người thật)
- **Threshold**: < 20% (nghĩa là AI tự giải quyết được > 80% trường hợp).
- **Red flag**: > 40% (Nếu quá cao, nghĩa là bot vô dụng, khách toàn đòi gặp Sale).
