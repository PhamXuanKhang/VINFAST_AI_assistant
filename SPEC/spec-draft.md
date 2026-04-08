# SPEC_draft_Nhom_2A202600267_E403

## Track: VinFast

## Problem statement
Khách hàng quan tâm xe ô tô điện VinFast thường có nhiều câu hỏi lặp lại về các dòng xe (phiên bản, tính năng, thông số kĩ thuật, so sánh) và đặc biệt muốn có ước tính tài chính (Ví dụ trả trước, trả góp hoặc vay) ngay lập tức. Hiện tại khách thường phải chờ Sales hoặc CSKH phản hồi hoặc Sales tính toán thủ công, dẫn tới chậm trễ trong việc bán xe và làm giảm tỷ lệ chuyển đổi khách hàng.

## Canvas draft

| | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| Trả lời | Khách hàng nhận tư vấn **24/7** cho câu hỏi về xe và nhận **bảng tính trả góp dự kiến** ngay (không chờ Sales tính). Doanh nghiệp kỳ vọng **giảm tải 40–50%** FAQ và tăng chuyển đổi lead nhờ phản hồi tức thì. | Minh bạch đây là AI. Các câu trả lời về **thông số** và **chính sách tài chính/ưu đãi** phải đúng theo tài liệu của Vinfast. Với tài chính luôn có phần khẳng định: “Bảng tính mang tính chất tham khảo, tư vấn viên sẽ chốt con số cuối cùng.” Nếu thiếu dữ liệu thì nói rõ không chắc chắn hoặc không có dữ liệu và đề nghị chuyển tư vấn viên. | Dùng **RAG** để truy xuất thông tin từ page hoặc tài liệu chính thức của VinFast. Phần tính toán tài chính dùng **Function Calling/Tools** (hàm/API) để tính trả góp chuẩn xác thay vì để LLM tự làm toán. Có cơ chế **human handoff** khi cần chốt deal hoặc câu hỏi vượt phạm vi. |

**Auto hay aug?** Augmentation — AI tư vấn và ước tính, khách hàng + tư vấn viên chốt cuối.

**Learning signal:** Explicit (Like, Dislike). Implicit (handoff rate, session length, hỏi lại cùng chủ đề).

## Hướng đi chính
- Prototype: chatbot hỏi đáp xe ô tô điện + tài chính; hỗ trợ 4 paths (Happy / Low-confidence / Failure / Correction)
- Eval: tỷ lệ Like, Dislike, tỷ lệ handoff sau câu trả lời, và tỷ lệ người dùng hoàn tất để lại SĐT ở Happy Path
- Main failure mode: câu hỏi chung chung (“xe điện rẻ nhất trả góp thế nào?”) hoặc câu hỏi nhạy cảm hoặc ngoài phạm vi (so sánh hãng khác, tin báo chí) → AI cần hỏi làm rõ hoặc chuyển tư vấn viên

## Phân công
- Nam: Crawl data xe điện Vinfast + back end
- Ngọc: UI UX demo, prototype
- Khang: Làm các Tool cho agent
- Thức: Xây dựng logic cho Agent
- Duy: Xây dựng logic cho Agent