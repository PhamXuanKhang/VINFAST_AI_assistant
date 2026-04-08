## AI Product Canvas — VinFast AI Assistant (Hỏi đáp xe và Tài chính kbi mua xe)

### Value (Giá trị mang lại)
- **Khách hàng**
  - Trải nghiệm tư vấn **24/7, phản hồi tức thì** cho các câu hỏi về dòng xe VinFast bao gồm phiên bản, tính năng, thông số và so sánh các dòng xe Vinfast với nhau.
  - Nhận ngay **bảng tính trả góp dự kiến** (trả trước/kỳ hạn/lãi suất tham chiếu) thay vì chờ sale tính toán thủ công.
  - Giảm công sức tìm kiếm thông tin rời rạc: AI tổng hợp và trình bày rõ ràng, theo ngữ cảnh câu hỏi.
  - Có human handoff: khi người dùng cần chốt con số mua xe hoặc ưu đãi, AI chuyển hướng sang **tư vấn viên con người**.
- **Doanh nghiệp (VinFast)**
  - Giảm thiểu chi phí cần bỏ ra để thuê sale tư vấn mua xe cho khách hàng.
  - **Giảm tải 40–50%** thời gian trả lời câu hỏi lặp lại (FAQ) cho Sales khi phải cùng một lúc trả lời rất nhiều người.
  - **Tăng tỷ lệ chuyển đổi khách hàng tiềm năng** nhờ giữ chân khách hàng trong thời điểm vàng (khi khách hàng đang hứng thú và cần phản hồi ngay).
  - Chuẩn hoá trải nghiệm tư vấn: thông tin xe và chính sách được trả lời nhất quán, giảm sai lệch do truyền miệng.

### Trust (Sự tin cậy)
- **Minh bạch**
  - Luôn thông báo rõ ràng: **đây là AI Assistant**.
- **Miễn trừ trách nhiệm (tài chính)**
  - Mọi kết quả tính toán trả góp hay vay đều hiển thị dòng:
    - **“Bảng tính mang tính chất tham khảo, tư vấn viên sẽ chốt con số cuối cùng.”**
  - Nêu rõ các giả định đầu vào (giá xe tham chiếu, trả trước, kỳ hạn, lãi suất tham chiếu, phí nếu có).
- **Kiểm soát ảo giác**
  - Nếu không có nguồn chính thức hoặc không truy xuất được dữ liệu phù hợp: AI phải nói **không chắc chắn hoặc không có dữ liệu**, không bịa; đề xuất truy cập nguồn chính thức hoặc chuyển tư vấn viên.

### Feasibility (Tính khả thi)
- **Đánh giá**: Cao.
- **Cách làm đề xuất**
  - **RAG (Retrieval-Augmented Generation)** để truy xuất dữ liệu từ:
    - Thông tin chi tiết trên page chính thức của VinFast, FAQ chính thức, chính sách bán hàng, chính sách ưu đãi tài chính.
  - **Tool/Function Calling** cho phần tính toán tài chính:
    - Dùng hàm/API tính toán lãi suất và lịch trả góp chuẩn xác thay vì để LLM tự tính (giảm rủi ro sai số và ảo giác).
    - Đầu ra: bảng tóm tắt (tiền vay, ước tính trả hàng tháng, tổng lãi tham chiếu, kỳ hạn).
- **Vận hành**
  - Có quy trình cập nhật nguồn tri thức khi chính sách hoặc thông tin xe thay đổi.
  - Có cơ chế human handoff giúp chuyển sang tư vấn viên khi câu hỏi vượt phạm vi hoặc cần chốt deal.

### Learning Signal (Tín hiệu học hỏi)
- **Explicit (Đánh giá câu trả lời từ phía khách hàng)**
  - Nút **Like / Dislike** sau mỗi câu trả lời.

- **Implicit (Thu thập thông tin ngầm định)**
  - **Handoff rate**: tỷ lệ người dùng yêu cầu gặp tư vấn viên con người ngay sau câu trả lời của AI.
  - **Session length**: thời gian tương tác hoặc số lượt trao đổi trong phiên.
  - Tỷ lệ hỏi lại cùng chủ đề ngay sau câu trả lời (metric đo lường cho mức độ chưa thuyết phục/khó hiểu).
  - Tỷ lệ click vào link trích dẫn nguồn (metric cho mức tin cậy và mức quan tâm).
