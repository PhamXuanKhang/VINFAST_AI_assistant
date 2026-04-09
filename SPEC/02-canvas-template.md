# AI Product Canvas — VinFast AI Assistant

## Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi guide** | User nào? Pain gì? AI giải quyết gì mà cách hiện tại không giải được? | Khi AI sai thì user bị ảnh hưởng thế nào? User biết AI sai bằng cách nào? User sửa bằng cách nào? | Cost bao nhiêu/request? Latency bao lâu? Risk chính là gì? |
| **Trả lời** | Khách hàng mua xe ô tô điện VinFast. Chờ đợi tư vấn lâu, khó xin ước tính trả góp ngay lập tức. AI trả lời ngay tức khắc 24/7 và gọi tool phân tích trả góp tự động. | AI tính giá sai hoặc sai thông số gây hiểu nhầm. Khách hàng nhận ra nếu so lại với web chính thức. Sửa bằng cách yêu cầu kết nối với Telesale/Sales thực đính chính. | ~.01-0.03/request tùy LLM. Latency <3s. Risk: Hallucinate chính sách giá hoặc thông tin nhạy cảm. |

---

## Automation hay augmentation?

☐ Automation — AI làm thay, user không can thiệp
☒ Augmentation — AI gợi ý, user quyết định cuối cùng

**Justify:** Công cụ này chủ yếu đưa ra ước tính trả góp dựa vào mong muốn hiện tại của khách. Với giá trị sản phẩm lớn như xe hơi, việc chốt deal cần con người làm bước cuối (ký hợp đồng thật). AI đóng vai trò chốt sale vòng ngoài (Augmentation).

---

## Learning signal

| # | Câu hỏi | Trả lời |
|---|---------|---------|
| 1 | User correction đi vào đâu? | Mỗi lần khách hàng dislike/hỏi lại câu cũ/yêu cầu gặp người thật -> Log vào metric dashboard. |
| 2 | Product thu signal gì để biết tốt lên hay tệ đi? | Implicit: Handoff rate, Session length. Explicit: Thumbs up / Thumbs down trên tin nhắn trả lời. |
| 3 | Data thuộc loại nào? |thông số  Domain-specific (xe VinFast) + Real-time (Bảng giá và khuyến mãi mới nhất được crawl về hệ thống) |

**Có marginal value không?**
Có. Data bảng giá trả góp, chiết khấu và ưu đãi chính sách thay đổi linh hoạt theo đợt bán hàng của VinFast mà Model nền tảng (như ChatGPT/Gemini gốc) không thể có. Thu thập hội thoại thực tế giúp lọc các FAQ phức tạp để cải tiến Knowledge Base.
