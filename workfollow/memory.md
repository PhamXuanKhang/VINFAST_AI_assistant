# Cơ chế Memory trong VinFast AI Assistant

Cơ chế memory (bộ nhớ) của Agent được xây dựng theo kiến trúc **Stateful Memory** (Bộ nhớ dựa trên trạng thái) và được quản lý thông qua thư viện **LangGraph**. Hệ thống này hoạt động như một Cỗ máy trạng thái (State Machine) kết hợp quản lý lịch sử hội thoại, thay vì chỉ lưu text đơn thuần.

Dưới đây là 3 cột trụ định hình nên cơ chế Memory của AI:

## 1. Phân vùng Session bằng Thread ID (`thread_id`)
Mỗi phiên chat của người dùng được phân tách và lưu trữ độc lập dựa trên `thread_id`.

- **Checkpointer:** Hiện tại dự án sử dụng `MemorySaver()` (lưu trực tiếp trong RAM) xuất phát từ thư viện `langgraph.checkpoint.memory`.
- **Hoạt động:** Khi gọi hàm `chat(user_message, thread_id)` tại gateway, LangGraph sẽ dùng mã hash này làm chìa khóa. Nó mở "ngăn kéo trí nhớ" tương ứng để khôi phục trạng thái. Miễn là application chưa bị tắt, bot sẽ tự động giữ đúng luồng chat cho từng session độc lập.

## 2. Lưu trữ hội thoại nối tiếp (`messages`)
Mảng lưu vết text chat được định nghĩa đặc biệt thông qua module của LangGraph:
```python
messages: Annotated[list, add_messages]
```
- Module `add_messages` đóng vai trò là một *reducer*. Ở mỗi lượt chạy mới, thay vì ghi đè (overwrite), hệ thống sẽ nạp và nối thêm (append) nội dung mới của User/AI vào đoạn cuối mảng `messages`.
- Việc liên tục duy trì danh sách này giúp đẩy đầy đủ "ngữ cảnh" vào Prompt cho LLM trong các chu kỳ tư duy sau đó.

## 3. Trí nhớ Trạng thái Nghiệp vụ (Slot Filling / Fields)
Đây là đặc tính khiến dự án vượt ra khỏi chuẩn mực "chatbot đọc text". Trong cấu trúc `VinFastState` (file `state.py`), nó khai báo các biến cụ thể để nhốt thông tin đã extract được:
- `current_phase`: Định vị vị trí hiện tại của cuộc trò chuyện (Chào hỏi, Chọn xe hay Tính toán tài chính).
- `selected_car_id`: Lưu trữ mã định danh của chiếc xe khách hàng đang để mắt tới.
- `finance_slots`: Một biến dạng JSON / Dict nhốt các thông số quan trọng (Chỉ định trả trước bao nhiêu %, số tháng dự định vay, lãi suất...).

**Quy trình trích xuất ngầm (Post-processing Node):**
- Thông qua node `extract_state_updates` (nằm tại `nodes.py`), hệ thống có một mắt xích phân tích hậu kỳ (đọc sau khi AI đã sinh text hoặc gọi tool). 
- Bất cứ khi nào nhận diện trong log có việc thiết lập xong thông tin (VD: gọi api tìm thông tin xe và user ưng ý VF5), logic code tự động đẩy biến `selected_car_id = "VF5_PLUS"` và ghim kiên cố vào trong Cấu trúc State memory. 
- Tại những pha sau, module tính toán của hệ thống sẽ ngó thẳng vào các biến này thay vì nhìn chuỗi text tự nhiên.

---

> [!WARNING]
> **Điểm cần lưu ý (Vấn đề Production):** Do hệ thống đang gắn với `MemorySaver()`, bộ nhớ sẽ reset sạch sành sanh và mất trắng khi server Application (Python backend) bị restart. Để đưa hệ thống lên Production dài hạn, cần trỏ memory checkpoint xuống cơ sở dữ liệu vật lý, ví dụ: chuyển sang kiến trúc `SqliteSaver()` hoặc `RedisSaver()`.
