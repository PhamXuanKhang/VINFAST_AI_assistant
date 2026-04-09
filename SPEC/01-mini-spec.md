# SPEC — AI Product Hackathon

**Nhóm:** 2A202600267_E403
**Track:** ☑ VinFast · ☐ Vinmec · ☐ VinUni-VinSchool · ☐ XanhSM · ☐ Open
**Problem statement (1 câu):** Khách hàng quan tâm xe điện VinFast gặp khó khăn khi phải chờ đợi tư vấn viên cung cấp thông tin và tính toán chi phí trả góp; AI sẽ cung cấp tư vấn tức thời 24/7 và ước tính chi phí trả góp tự động để giảm tải cho CSKH và tăng tỷ lệ chuyển đổi.

---

## 1. AI Product Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | Khách mua xe VinFast. Trễ phản hồi, tính toán trả góp thủ công. AI tư vấn 24/7 và tính phí lập tức. | AI có thể tính sai hoặc tư vấn sai thông số. Cần ghi chú cảnh báo. Nếu sai, khách chat lại hoặc chọn gặp tư vấn viên. | Cost gọi LLM + functions (~$0.01-0.03/req). Risk: Hallucinate chính sách giá hoặc thông tin nhạy cảm. |

**Automation hay augmentation?** ☐ Automation · ☑ Augmentation
Justify: Việc mua xe là quyết định lớn, cần con người (Sales) chốt hợp đồng cuối cùng. AI đóng vai trò tư vấn bước đầu và tính toán số liệu hỗ trợ (Augmentation).

**Learning signal:**

1. User correction đi vào đâu? Khi user yêu cầu handoff qua Telesale, dislike tin nhắn hoặc hỏi lại cặn kẽ cùng 1 chủ đề nều bị parse sai, hệ thống lưu log (correction log) để cải thiện luồng RAG và Tool prompt.
2. Product thu signal gì để biết tốt lên hay tệ đi? Implicit: Handoff rate, drop-off rate, Session length. Explicit: Tỷ lệ Like / Dislike. Tỷ lệ chuyển đổi (để lại SĐT).
3. Data thuộc loại nào? ☐ User-specific · ☑ Domain-specific · ☑ Real-time · ☐ Human-judgment · ☐ Khác
   Có marginal value không? Có, model nền tảng (như ChatGPT/Gemini) không nắm bắt được bảng giá, chính sách chiết khấu liên tục thay đổi của hãng. Dữ liệu hội thoại thu thập giúp tinh chỉnh kho kiến thức độc quyền.

---

## 2. User Stories — 4 paths

### Feature: Tư vấn thông tin xe và tính toán trả góp dự kiến

**Trigger:** Khách hàng hỏi thông tin một dòng xe cụ thể (VD: VF5) và muốn biết giá hoặc chi phí trả trước.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI lấy đúng thông số xe và chính sách mới nhất, gọi tool sinh ra bảng tính gốc/lãi. Khách hài lòng để lại thông tin (SĐT) đặt cọc / xin liên hệ Sale. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Câu hỏi thiếu tham số (VD: "VF5 sao?" hoặc không rõ lãi suất ngân hàng nào). AI bắt buộc hỏi lại để clarified, hoặc đưa ra các lựa chọn giả định để khách click, kết hợp nút "Chuyển tư vấn viên". |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI tính ra số tiền đóng dội lên vô lý hoặc báo giá sai. Khách thấy đắt. Dưới bảng tính có sẵn Disclaimer: "Chỉ mang tính tham khảo". Khách phản ứng và AI cung cấp ngay nút "Chat với tư vấn viên" để sửa sai. |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Khách bảo "Ý tôi là 30% giá xe cơ" hoặc nhấn nút Dislike. Phản hồi và hội thoại log lại chuyển offline cho đội duy trì Knowledge Base cập nhật lại RAG hoặc sửa prompt hàm Tool. |

---

## 3. Eval metrics + threshold

**Optimize precision hay recall?** ☑ Precision · ☐ Recall
Tại sao? Tư vấn về tài chính, giá cả, và thông số kỹ thuật xe hơi yêu cầu sự chính xác cao nhất (Precision). Đưa thông tin sai (giá thấp hơn thực tế) sẽ gây khủng hoảng truyền thông hoặc mất niềm tin. Nếu recall thấp, AI chỉ cần hỏi lại cho rõ (rủi ro thấp hơn đưa thông tin sai lệch).

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| Mức độ chính xác thông tin (Factuality) / Tính toán giá | ≥95% | <85% trong 1 tuần (gây rủi ro bán hàng / mất trust) |
| Tỷ lệ hài lòng (Explicit Like / Dislike) | ≥60% Like | <45% Like liên tục trong 2 tuần |
| Tỷ lệ Handoff rate sau câu hỏi | 15% - 35% | <10% (LLM đang bịa) hoặc >50% (LLM vô dụng) |
| Tỷ lệ chuyển đổi lead (để lại SĐT trên Happy Path) | ≥15% | <5% (không mang lại ROI cho Sales) |

---

## 4. Top 3 failure modes

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | Khách hỏi số liệu tài chính cụ thể nhưng RAG thiếu, AI tự tin bịa số (Hallucination) | Khách tin số liệu giả, làm rùm beng khi gặp tư vấn thật | Ép LLM dùng Tool tính toán từ nguồn dữ liệu đã duyệt, kèm disclaimer "tham khảo". Nếu thiếu data, bắt buộc fallback trả lời không biết và handoff. |
| 2 | Truy vấn quá mơ hồ ("Trả góp rẻ nhất?") | AI tự đoán parameter tính ra phương án sai lệch nhu cầu, gây bực mình | Build luồng slot-filling buộc bot phải hỏi lại những tham số tối thiểu, hoặc giả định minh bạch (VD: "Giả sử anh vay 5 năm..."). |
| 3 | Prompt injection / Hỏi so sánh hãng xe khác (Out-of-scope) | AI bình luận không hay về hãng khác hoặc nói linh tinh, rủi ro brand PR | Hard-rule guardrails. Lọc từ ngữ nhạy cảm ở ngõ vào và ra. Chặn khen chê đối thủ, lái về ưu điểm VinFast hoặc chuyển Sales. |

---

## 5. ROI 3 kịch bản

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | 500 khách/ngày, tỷ lệ FAQ tự động ~40-60%. Tỷ lệ để lại SĐT thấp | 2000 khách/ngày, tỷ lệ FAQ tự động ~75%. Tỷ lệ chốt lead tăng khá | 5000+ khách, tỷ lệ FAQ được giải quyết >90%. Tỷ lệ chốt cao |
| **Cost** | ~$30-50/ngày (API/Tool/Infra) | ~$60-100/ngày (API/Tool) | ~$150-200/ngày (API/Tool) |
| **Benefit** | Giảm 10h cho Sales. Tăng nhẹ độ phủ 24/7 | Giảm 40h cho Sales, tăng từ 3-5% lượng lead đẩy về | Giảm >100h Sales, tăng 10-15% lead, chốt deal nhanh cực độ |
| **Net** | ROI dương nhỏ / Hoà vốn | Tiết kiệm chi phí CSKH thấy rõ, hoàn vốn nhanh | Thay đổi mô hình kinh doanh, Sales chỉ tập trung chốt High-touch |

**Kill criteria:** Cost vượt quá chi phí thuê Telesale hàng tháng HOẶC Factuality giảm <85% trong một tuần HOẶC Like/Dislike <45% kéo dài.

---

## 6. Mini AI spec (1 trang)

VinFast AI Assistant là trợ lý tư vấn xe ô tô điện 24/7 (mô hình Augmentation), phục vụ tệp khách hàng tiềm năng truy cập vào Web/Fanpage muốn tham khảo nhanh thông số kỹ thuật, so sánh mẫu xe và đặc biệt là nhận báo cáo dự tính trả góp lập tức mà không phải đợi Sales tính tay.

Sản phẩm kết hợp giữa công nghệ AI RAG truy vấn kho tri thức chuẩn của hãng và Function Calling để xử lý độ lệch pha về cách gọi của khách hàng (VD: bóc tách model, tỷ lệ vay) đưa vào công cụ phân tích tài chính nội bộ. Vì quyết định mua xe hơi có ảnh hưởng tài chính lớn, mô hình tối ưu tuyệt đối cho Precision (Mức độ chính xác >95%) - ưu tiên thà báo "không chắc" xử lý Fallback đưa cho tư vấn viên, còn hơn xảy ra Hallucination giá cả gây rủi ro thương hiệu và mất Trust. 

Hệ thống sở hữu "Data Flywheel" mạnh bằng cách đo đạc Handoff rate, ghi nhận log "Dislike" từ người dùng khi xảy ra sai sót (Failure paths) để tinh chỉnh liên tục hệ quản trị cơ sở dữ liệu chuyên ngành, từ đó nâng cao tỷ lệ hoàn tất điền số điện thoại tư vấn (Conversion Lead) giúp tăng trưởng doanh số với chi phí Customer Support nhỏ nhất.