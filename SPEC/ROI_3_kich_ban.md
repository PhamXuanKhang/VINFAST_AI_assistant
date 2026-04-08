## 5. ROI 3 kịch bản (Return on Investment)

Tài liệu này viết lại mục ROI theo hướng “dùng được để ra quyết định”, bám sát phạm vi VinFast AI Assistant trong repo:
- **RAG** cho thông tin xe/chính sách từ nguồn chính thức.
- **Tool/Function calling** cho tính toán trả góp/vay (không để LLM tự tính).
- **Human handoff** khi cần chốt deal, thiếu dữ liệu, hoặc câu hỏi nhạy cảm/ngoài phạm vi.
- Đánh giá chất lượng theo `SPEC/eval_metrics..md` và kiểm soát rủi ro theo `SPEC/3_failure_nodes.md`.

### 5.1. Mục tiêu ROI và câu hỏi cần trả lời
- **Mục tiêu**: định lượng hiệu quả kinh tế của chatbot (tiết kiệm chi phí + tăng lead/doanh thu) và xác định mốc **hoàn vốn**.
- **Câu hỏi cốt lõi**:
  - Bot tiết kiệm được bao nhiêu giờ công của Sales/CSKH mỗi tháng?
  - Bot làm tăng bao nhiêu **lead** (để lại SĐT) nhờ phản hồi 24/7 + bảng tính trả góp?
  - Chi phí vận hành bot là bao nhiêu, và payback period là bao lâu?

### 5.2. Phạm vi tính ROI (Scope)
#### In-scope (tính vào lợi ích)
- **Tiết kiệm chi phí vận hành**: giảm tải FAQ và các truy vấn lặp lại.
- **Tăng lead**: tăng tỷ lệ để lại SĐT nhờ giảm ma sát (tính trả góp nhanh, phản hồi tức thì).
- **Giảm rơi rụng phiên**: giảm thời gian chờ; coi là “tín hiệu hỗ trợ” cho ROI.

#### Out-of-scope (chưa quy đổi tiền ở giai đoạn đầu)
- Giá trị thương hiệu/NPS dài hạn.
- Doanh số offline không có tracking attribution rõ ràng.
- Use-case ngoài phạm vi tư vấn xe + tài chính tham khảo.

### 5.3. Chuẩn hoá mô hình ROI (biến số + công thức)
Mục tiêu của phần này là giúp team thay “con số thực tế của VinFast” vào là ra ROI, thay vì ước lượng cảm tính.

#### Inputs (biến đầu vào)
- **V**: số phiên hội thoại mỗi tháng (sessions/month).
- **AHT_human**: thời gian trung bình để tư vấn viên xử lý 1 truy vấn tương tự (phút).
- **C_human**: chi phí bình quân theo phút của Sales/CSKH (VNĐ/phút).
- **H**: Human Handoff Rate (tỷ lệ chuyển sang người thật).
- **LR**: lead rate baseline (tỷ lệ để lại SĐT khi không có bot).
- **ΔLR**: mức tăng lead rate nhờ bot (lead uplift).
- **EV_lead**: giá trị kỳ vọng/lead (có thể là ARPL hoặc expected value theo funnel).
- **Cost_fixed**: chi phí cố định/tháng (vận hành, QA, cập nhật tri thức, giám sát, hạ tầng tối thiểu).
- **Cost_var**: chi phí biến đổi theo usage (LLM tokens, truy xuất vector, tool calls, logging).

#### Lợi ích 1 — Tiết kiệm chi phí vận hành
- **Minutes_saved** = \(V \times (1 - H) \times AHT_human\)
- **Saving** = \(Minutes_saved \times C_human\)

#### Lợi ích 2 — Tăng lead/doanh thu
- **Leads_uplift** = \(V \times ΔLR\)
- **Uplift** = \(Leads_uplift \times EV_lead\)

#### Chi phí, lợi ích ròng, ROI
- **Cost_total** = \(Cost_fixed + Cost_var\)
- **Net_benefit/month** = \(Saving + Uplift - Cost_total\)
- **ROI** = \(Net_benefit/month \div Cost_total\)
- **Payback period (tháng)** = \(Setup_cost \div Net_benefit/month\) (nếu có chi phí đầu tư ban đầu)

> Nếu chưa có dữ liệu EV_lead, vẫn có thể tính “ROI tối thiểu” dựa trên **Saving** và theo dõi Uplift như upside.

### 5.4. Điều kiện “ROI hợp lệ” (gắn với Eval Metrics)
ROI chỉ nên được coi là hợp lệ khi chất lượng đạt ngưỡng, vì bot sai về tiền/giá có thể tạo thiệt hại lớn hơn lợi ích.
- **Task Success Rate**: mục tiêu > 85% (`SPEC/eval_metrics..md`).
- **Hallucination Rate**: mục tiêu < 5%; lỗi liên quan giá/tiền coi là red flag.
- **Human Handoff Rate**: mục tiêu < 20% khi đã scale (pilot có thể cao hơn nhưng phải có xu hướng giảm).

### 5.5. 3 kịch bản ROI (thận trọng / thực tế / lạc quan)
Các kịch bản dưới đây mô tả “hành vi hệ thống + hành vi người dùng”. Khi có số thực tế (V, C_human, EV_lead...), chỉ cần thay vào mục 5.3 để ra ROI.

#### Conservative (Kịch bản thận trọng)
- **Giả định**:
  - Bot tự xử lý ~**20%** truy vấn (handoff \(H \approx 80\%\)).
  - Chủ yếu trả lời FAQ cơ bản; các ca tính tài chính thường phải handoff do thiếu dữ liệu/tool chưa ổn định.
  - **ΔLR ~ 0** (không tăng đáng kể tỷ lệ để lại SĐT).
- **Tác động chính**:
  - ROI chủ yếu đến từ **tiết kiệm chi phí** một phần (giảm tải FAQ, hỗ trợ ca đêm).
  - Uplift doanh thu ghi nhận như “upside” chưa chắc chắn.
- **Thời gian thu hồi vốn (tham chiếu)**: **12 – 18 tháng**.

#### Realistic (Kịch bản thực tế)
- **Giả định**:
  - Bot tự động hoá ~**50%** truy vấn lặp lại (handoff \(H \approx 50\%\)).
  - Luồng “tính trả góp tham khảo” ổn định nhờ tool calling (đúng khuyến nghị trong failure mode: không để LLM tự làm toán).
  - **ΔLR = +10–15%** nhờ phản hồi 24/7 + bảng tính nhanh.
  - Task Success Rate đạt ~**85%+**, Hallucination < **5%**.
- **Tác động chính**:
  - Kết hợp **tiết kiệm chi phí** và **tăng lead chất lượng**.
  - Giảm rơi rụng trong phiên, tăng khả năng “chốt hẹn” với tư vấn viên.
- **Thời gian thu hồi vốn (tham chiếu)**: **6 – 9 tháng**.

#### Optimistic (Kịch bản lạc quan)
- **Giả định**:
  - Bot xử lý **> 80%** truy vấn (handoff \(H \le 20\%\)), tiệm cận mục tiêu scale.
  - Guardrails tốt (jailbreak/prompt injection được chặn), dữ liệu động luôn cập nhật (giá/khuyến mãi/lãi suất tham chiếu).
  - Lead uplift mạnh và/hoặc conversion online tăng rõ rệt:
    - **ΔLR cao** và/hoặc
    - doanh số online tăng **5–10%** (khi có tracking).
- **Tác động chính**:
  - ROI đến từ cả **tối ưu chi phí** lẫn **tăng doanh số/giá trị lead**.
- **Thời gian thu hồi vốn (tham chiếu)**: **< 3 tháng**.

### 5.6. Checklist dữ liệu cần có để “chốt” ROI bằng số thật
- **Traffic & hành vi**: V (sessions/month), tỉ lệ quay lại, session length.
- **Vận hành**: AHT_human, C_human, cơ cấu ca trực (đặc biệt khung giờ đêm/cuối tuần).
- **Lead funnel**: baseline LR, ΔLR theo kênh, tỉ lệ chuyển đổi từ lead → test drive → hợp đồng (để suy ra EV_lead).
- **Chi phí bot**: Cost_fixed, Cost_var (theo 1k sessions), chi phí QA/giám sát/cập nhật tri thức.
- **Chất lượng**: Task Success, Hallucination, Handoff (theo `SPEC/eval_metrics..md`).

### 5.7. Gợi ý lộ trình đo ROI theo pha (pilot → scale)
- **Pha 1 (Pilot 2–4 tuần)**: ưu tiên Trust + Feasibility
  - Khoanh vùng intent: thông tin xe + trả góp tham khảo.
  - Thiết lập logging/analytics để đo: lead submit, handoff, task success.
- **Pha 2 (Mở rộng 1–2 tháng)**: tối ưu hiệu quả vận hành
  - Giảm Handoff bằng hỏi làm rõ (low-confidence path) và tăng coverage dữ liệu.
  - Bắt đầu tính Saving rõ ràng theo AHT_human và volume.
- **Pha 3 (Scale)**: tối ưu kinh doanh
  - A/B test prompt + CTA (đăng ký lái thử/để lại SĐT).
  - Chuẩn hoá EV_lead theo funnel để tính Uplift chắc hơn.
