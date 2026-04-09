# AGENTS.md — VinFast AI Chatbot (Vifa AI)

> Tài liệu hướng dẫn phát triển giao diện React.js cho chatbot tư vấn xe điện VinFast.  
> Phiên bản: 2.0 — Cập nhật: Admin Role, Chat History, Markdown/Table Rendering, Tối ưu luồng.

---

## 1. Tổng quan hệ thống

**Tên agent:** Vifa AI — Online Assistant  
**Loại:** Augmentation (AI gợi ý, con người quyết định cuối)  
**Scope:** Tư vấn xe điện VinFast + tính toán tài chính trả góp + quản lý lịch hẹn  
**Không thuộc scope:** So sánh hãng khác, tin tức báo chí, thông tin không liên quan VinFast

---

## 2. Kiến trúc luồng (Flow Architecture)

Toàn bộ hội thoại chia làm **3 giai đoạn tuần tự**, mỗi giai đoạn là một "Phase" trong state của React:

```
PHASE 0: GREETING
    ↓
PHASE 1: CAR_DISCOVERY  (vòng lặp cho đến khi khách ưng 1 mẫu)
    ↓
PHASE 2: FINANCE         (mua thẳng hoặc trả góp)
    ↓
PHASE 3: HANDOFF         (thu thập SĐT, đặt lịch hẹn hoặc chờ Sale gọi lại)
```

### State Machine tổng thể

```typescript
type Phase =
  | 'GREETING'
  | 'CAR_DISCOVERY'
  | 'FINANCE_QUESTION'        // hỏi mua thẳng hay trả góp
  | 'FINANCE_FULL_PAY'        // tư vấn mua thẳng
  | 'FINANCE_INSTALLMENT'     // tư vấn trả góp
  | 'HANDOFF_COLLECT'         // xin SĐT / tên / lịch hẹn
  | 'HANDOFF_DONE'            // kết thúc, chờ Sale liên hệ

type Confidence = 'HIGH' | 'LOW' | 'FAILURE'

type SignalType =
  | 'DISLIKE'
  | 'OUT_OF_SCOPE'
  | 'CORRECTION'
  | 'FAILURE'
  | 'HANDOFF'
```

### Nguyên tắc tối ưu luồng (v2.0)

- **Progressive slot-filling:** Không hỏi tất cả thông tin một lúc. Hỏi từng slot theo thứ tự ưu tiên và giải thích lý do cần thông tin đó.
- **Context persistence:** AI phải ghi nhớ toàn bộ context trong session. Nếu user đã đề cập ngân sách ở Phase 1, không hỏi lại ở Phase 2.
- **Graceful degradation:** Khi tool thất bại, AI phải có fallback response hợp lý thay vì trả về lỗi kỹ thuật.
- **One-shot correction:** Sau khi user correction, AI không được hỏi lại thông tin đã confirmed trước đó.

---

## 3. Mô tả từng Phase

### PHASE 0 — GREETING

**Trigger:** Khách mở widget chat  
**AI làm gì:** Chào hỏi, giới thiệu bản thân là AI, đặt câu hỏi mở  
**UI component:** `<GreetingBubble />` + `<QuickReplyBar />` với 2–3 gợi ý nhanh

**Quick replies gợi ý:**
- "Tôi muốn tìm hiểu về xe VinFast"
- "Tính trả góp xe điện"
- "So sánh các dòng xe"

**Cải tiến v2.0:** Nếu user quay lại sau session cũ (xác định qua `session_id` trong localStorage), AI chào theo tên đã lưu và hỏi "Bạn muốn tiếp tục tư vấn về [xe đã xem] không?" thay vì greeting mặc định.

**Chuyển sang:** `CAR_DISCOVERY` khi user nhập hoặc chọn quick reply

---

### PHASE 1 — CAR_DISCOVERY

**Trigger:** User mô tả nhu cầu xe (model, tính năng, ngân sách sơ bộ, hoàn cảnh gia đình)  
**AI làm gì:** Gọi tool `get_car_info()` → trả về thông số, giá, ảnh xe phù hợp

#### Tool được gọi:
```typescript
get_car_info(query: string, filters?: { model?, segment?, budget_range? })
→ CarInfo[]
```

#### 4 Paths trong CAR_DISCOVERY:

| Path | Trigger | UI xử lý |
|------|---------|----------|
| **Happy** | AI tìm đúng xe, khách hỏi rõ | Hiển thị `<CarCard />` với thông số + ảnh. Nút "Tìm hiểu thêm" và "Chọn xe này" |
| **Low-confidence** | Câu hỏi quá ngắn / mơ hồ ("VF5 sao?") | AI hỏi làm rõ: hiển thị `<ClarifyPrompt />` với 2–3 lựa chọn có sẵn |
| **Failure** | AI báo thông số sai, user phản hồi | Hiển thị nút `<HandoffButton label="Kết nối tư vấn viên" />` + xin lỗi |
| **Correction** | User nhấn Dislike / gõ "sai rồi" | Capture feedback → log vào dashboard, AI hỏi lại |

**Cải tiến v2.0 — So sánh đa mẫu:**  
Khi user muốn so sánh 2–3 mẫu xe, AI gọi `get_car_info()` song song cho từng mẫu và render `<CompareTable />` — bảng HTML có sticky header, highlight sự khác biệt nổi bật.

**Điều kiện chuyển Phase:** User nhấn "Chọn xe này" hoặc AI detect đủ tín hiệu ưng ý (từ khóa: "ổn", "được", "xe này đi", v.v.) → chuyển sang `FINANCE_QUESTION`

**Vòng lặp:** Nếu khách đổi ý hoặc còn thắc mắc → quay lại `CAR_DISCOVERY`

---

### PHASE 2A — FINANCE_QUESTION

**Trigger:** Khách đã chọn được mẫu xe  
**AI làm gì:** Hỏi phương thức mua  
**UI component:** `<FinanceOptionCard />` với 2 lựa chọn

```
[ 💳 Mua thẳng ]     [ 📅 Trả góp / Vay ngân hàng ]
```

---

### PHASE 2B — FINANCE_FULL_PAY

**Trigger:** Chọn "Mua thẳng"  
**AI làm gì:** Gọi tool `get_promotions()` → hiển thị khuyến mãi, giá lăn bánh  
**UI component:** `<PriceSummaryCard />` + `<PromotionBadge />`

#### Tool được gọi:
```typescript
get_promotions(model: string, region?: string)
→ { base_price, promotions[], road_registration_fee, total_on_road }
```

**Cải tiến v2.0:** Kết quả được render bằng `<PriceSummaryTable />` — bảng HTML có các hàng: Giá niêm yết / Ưu đãi / Lệ phí / **Tổng lăn bánh**, hàng tổng được highlight đậm.

**Disclaimer bắt buộc:** `"Giá trên mang tính tham khảo, tư vấn viên sẽ xác nhận con số chính thức."`

---

### PHASE 2C — FINANCE_INSTALLMENT

**Trigger:** Chọn "Trả góp"  
**AI làm gì:** Slot-filling 3 tham số bắt buộc trước khi tính:

```typescript
required_slots = {
  down_payment: number | null,        // % hoặc số tiền tuyệt đối
  loan_term_months: number | null,    // 12 | 24 | 36 | 48 | 60
  interest_rate: number | null        // % / năm (default: lãi suất VinFast hiện hành)
}
```

**Chỉ gọi tool khi đủ cả 3 slot.** Nếu thiếu → AI hỏi lần lượt từng slot.

**UI component:** `<SlotFillForm />` hiển thị trạng thái từng slot (filled / pending)

**Xử lý Low-confidence lãi suất:**
> "Bạn muốn vay qua ngân hàng nào, hay để AI áp dụng lãi suất ưu đãi VinFast hiện tại (8%/năm)?"  
> → Hiển thị `<BankSelector />` hoặc nút "Dùng lãi suất VinFast"

#### Tool được gọi:
```typescript
calculate_installment({
  car_price: number,
  down_payment_ratio: number,        // 0.0–1.0
  loan_term_months: number,
  annual_interest_rate: number
})
→ {
  monthly_payment: number,
  total_payment: number,
  total_interest: number,
  schedule: MonthlyEntry[]           // amortization table
}
```

**UI output:** `<InstallmentTable />` — bảng HTML có sticky header, hiển thị tối đa 6 hàng đầu, nút "Xem đầy đủ" expand toàn bộ lịch trả nợ.

**Disclaimer bắt buộc:** Hiển thị nổi bật dưới bảng:
> `"⚠️ Bảng tính mang tính chất tham khảo. Tư vấn viên sẽ chốt con số cuối cùng."`

#### 4 Paths trong FINANCE_INSTALLMENT:

| Path | Trigger | UI xử lý |
|------|---------|----------|
| **Happy** | Đủ slot, tool tính xong | Hiển thị `<InstallmentTable />` + nút "Liên hệ để đặt cọc" |
| **Low-confidence** | Thiếu slot (ví dụ chưa chọn ngân hàng) | `<SlotFillForm />` highlight slot còn thiếu + câu hỏi làm rõ |
| **Failure** | Tool tính ra số bất thường (quá cao/thấp) | Hiển thị warning + nút "Kết nối tư vấn viên để kiểm tra" |
| **Correction** | User nói "Ý tôi là 30% giá xe" | AI parse lại, re-call tool. Log lỗi entity extraction để cải thiện |

---

### PHASE 3A — HANDOFF_COLLECT

**Trigger:** User nhấn "Đặt cọc", "Lái thử", "Liên hệ tư vấn viên"  
**AI làm gì:** Hỏi phương thức liên hệ  
**UI component:** `<HandoffOptionCard />` với 2 lựa chọn

```
[ 📞 Chờ Sale gọi lại ]     [ 📅 Đặt lịch xem xe ]
```

**Nhánh A — Chờ Sale gọi lại:**  
`<ContactForm />` — input tên + SĐT + checkbox đồng ý PDPA  
Sau submit → gọi `save_lead()` → chuyển `HANDOFF_DONE`

**Nhánh B — Đặt lịch xem xe (mới v2.0):**  
`<AppointmentForm />` — input tên + SĐT + chọn showroom + chọn ngày giờ  
Validate: SĐT 10 số VN, ngày không được là quá khứ, giờ trong khung 8:00–18:00.  
Sau submit → gọi `save_lead()` + `schedule_appointment()` → chuyển `HANDOFF_DONE`

**Validate chung:** SĐT 10 số VN (regex `/^(0[3|5|7|8|9])+([0-9]{8})$/`). Không submit nếu thiếu trường bắt buộc.

**Sau khi submit:**
1. Hệ thống gọi `save_lead({ name, phone, conversation_context, selected_car, finance_summary, appointment? })`
2. Nếu có appointment: gọi thêm `schedule_appointment(lead_id, datetime, showroom_id)`
3. Trigger CRM notification cho Sales team
4. Chuyển sang `HANDOFF_DONE`

---

### PHASE 3B — HANDOFF_DONE

**UI:** `<HandoffConfirmCard />` — thông báo thành công

- **Nếu chờ gọi lại:** "Cảm ơn [Tên]! Tư vấn viên VinFast sẽ liên hệ bạn trong vòng 30 phút trong giờ làm việc."
- **Nếu đặt lịch:** "Cảm ơn [Tên]! Lịch hẹn của bạn đã được xác nhận vào [ngày giờ] tại [showroom]. Mã xác nhận: [code]."

---

## 4. Xử lý Out-of-Scope & Guardrails

Khi user hỏi ngoài phạm vi (so sánh hãng khác, tin báo chí, prompt injection):

```
AI response: "Mình chỉ có thể tư vấn về xe điện VinFast.
Bạn có muốn mình hỗ trợ tìm hiểu mẫu xe hoặc tính toán tài chính không?"
```

**UI:** Hiển thị `<OutOfScopeCard />` + 2 quick reply để dẫn lại flow chính.  
**Log:** Mọi câu hỏi out-of-scope được log với flag `OUT_OF_SCOPE` để review.

**Cải tiến v2.0 — Phân loại out-of-scope:**

| Loại | Ví dụ | Xử lý |
|------|-------|-------|
| So sánh hãng khác | "VF8 vs Honda CR-V" | Redirect + quick reply |
| Tin tức / báo chí | "VinFast bị kiện ở Mỹ không?" | Redirect + quick reply |
| Kỹ thuật sâu | "ECU firmware VF9 version?" | Suggest handoff tư vấn viên |
| Prompt injection | "Ignore previous instructions..." | Hard block, không respond |

---

## 5. Lưu trữ lịch sử chat (Chat History — v2.0)

### Chiến lược lưu trữ

Chat history được lưu ở **2 lớp**:

**Lớp 1 — LocalStorage (client-side):** Phục vụ UX, khôi phục session khi user reload trang.

```typescript
interface StoredSession {
  session_id: string           // UUID, tạo lúc GREETING
  user_name?: string           // Điền sau HANDOFF
  messages: StoredMessage[]
  phase: Phase
  selected_car?: CarInfo
  finance_summary?: FinanceSummary
  created_at: string           // ISO 8601
  updated_at: string
}

interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string              // Raw Markdown string
  timestamp: string
  phase: Phase
  tool_calls?: ToolCall[]      // Dữ liệu tool để re-render component
  signal?: SignalType          // Nếu message này trigger signal
}
```

**Lớp 2 — Backend (server-side):** Toàn bộ session được gửi lên server khi:
- User hoàn thành `HANDOFF_DONE`
- Session kết thúc (beforeunload event) nếu đã qua Phase 1
- Mỗi 5 phút nếu session vẫn đang active (auto-save)

### Quản lý lịch sử phía client

```typescript
const SESSION_KEY = 'vifa_session'
const MAX_HISTORY_DAYS = 7

function initSession(): StoredSession {
  const stored = localStorage.getItem(SESSION_KEY)
  if (stored) {
    const parsed: StoredSession = JSON.parse(stored)
    const age = Date.now() - new Date(parsed.updated_at).getTime()
    if (age < MAX_HISTORY_DAYS * 86400 * 1000) return parsed
  }
  return createNewSession()
}

function saveMessage(msg: StoredMessage) {
  const session = initSession()
  session.messages.push(msg)
  session.updated_at = new Date().toISOString()
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearHistory() {
  localStorage.removeItem(SESSION_KEY)
}
```

### Hiển thị lịch sử

- Khi load lại trang, `<MessageList />` render lại toàn bộ messages từ localStorage.
- Tool-based components (`<CarCard />`, `<InstallmentTable />`) được re-render từ `tool_calls` data trong message, không gọi lại API.
- Hiển thị `<SessionDivider />` "--- Hội thoại trước ---" nếu session > 30 phút trước.

### Nút xoá lịch sử

`<ChatHeader />` có icon "🗑️ Cuộc hội thoại mới" — click → confirm dialog → `clearHistory()` → reload.

---

## 6. Learning Signal — UI Implementation

### Explicit Feedback
Mỗi bubble tin nhắn AI có: `👍` / `👎` ẩn, hiện khi hover  
Khi nhấn 👎 → hiện `<FeedbackModal />` với lý do: "Sai thông tin" / "Không liên quan" / "Khác"

### Implicit Signals (log tự động)

| Signal | Cách đo |
|--------|---------|
| Handoff rate | Đếm session kết thúc bằng HANDOFF / tổng session |
| Session length | Timestamp từ GREETING → HANDOFF hoặc rời trang |
| Re-ask rate | Detect user hỏi lại cùng chủ đề trong 1 session |
| Slot correction rate | Đếm lần tool bị gọi lại sau correction |
| Appointment rate | Đếm HANDOFF chọn "Đặt lịch" / tổng HANDOFF |
| Appointment confirm rate | Đếm lịch hẹn được xác nhận / tổng lịch hẹn đặt qua AI |

---

## 7. Frontend — Yêu cầu kỹ thuật (v2.0)

### 7.1 Markdown Rendering

**Thư viện:** `react-markdown` + `remark-gfm` (hỗ trợ GFM: table, strikethrough, task list)

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'  // cho phép HTML inline nếu cần

function AiBubble({ content }: { content: string }) {
  return (
    <div className="ai-bubble">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ children }) => (
            <div className="table-wrapper">
              <table className="md-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="md-th">{children}</th>,
          td: ({ children }) => <td className="md-td">{children}</td>,
          code: ({ inline, children }) =>
            inline
              ? <code className="inline-code">{children}</code>
              : <pre className="code-block"><code>{children}</code></pre>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
               className="md-link">{children}</a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

**Lưu ý:** AI response luôn được format Markdown. Các response có dữ liệu dạng bảng (so sánh xe, bảng giá, lịch trả góp tóm tắt) phải được AI trả về dưới dạng Markdown table để render nhất quán.

### 7.2 Hiển thị bảng HTML

**Hai loại bảng trong hệ thống:**

**A) Markdown table** — dùng cho nội dung ngắn, AI tự tạo trong response:

```css
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin: 12px 0;
}

.md-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.md-th {
  background: var(--surface-secondary);
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.md-td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-color-light);
  vertical-align: top;
}

.md-table tr:last-child td { border-bottom: none; }
.md-table tr:nth-child(even) td { background: var(--surface-zebra); }
```

**B) Component table** — dùng cho `<InstallmentTable />`, `<CompareTable />`, `<PriceSummaryTable />` — là React component riêng, nhận data từ tool response:

```tsx
interface InstallmentTableProps {
  schedule: MonthlyEntry[]
  summary: {
    monthly_payment: number
    total_payment: number
    total_interest: number
  }
}

function InstallmentTable({ schedule, summary }: InstallmentTableProps) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? schedule : schedule.slice(0, 6)

  return (
    <div className="component-table-wrap">
      <div className="summary-bar">
        <span>Trả hàng tháng: <strong>{fmt(summary.monthly_payment)}</strong></span>
        <span>Tổng tiền lãi: <strong>{fmt(summary.total_interest)}</strong></span>
      </div>
      <div className="table-wrapper">
        <table className="installment-table">
          <thead>
            <tr>
              <th>Tháng</th><th>Gốc</th><th>Lãi</th>
              <th>Thanh toán</th><th>Còn lại</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{fmt(row.principal)}</td>
                <td>{fmt(row.interest)}</td>
                <td>{fmt(row.payment)}</td>
                <td>{fmt(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schedule.length > 6 && (
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Thu gọn ▲' : `Xem tất cả ${schedule.length} tháng ▼`}
        </button>
      )}
      <div className="disclaimer">
        ⚠️ Bảng tính mang tính chất tham khảo. Tư vấn viên sẽ chốt con số cuối cùng.
      </div>
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
```

### 7.3 Thiết kế giao diện

**Design tokens:**

```css
:root {
  --color-primary:       #006FEE;
  --color-primary-hover: #005BC4;
  --color-success:       #17C964;
  --color-warning:       #F5A524;
  --color-danger:        #F31260;

  --surface-chat:        #F4F4F5;
  --surface-secondary:   #F8F9FA;
  --surface-zebra:       #FAFBFC;
  --surface-ai-bubble:   #FFFFFF;
  --surface-user-bubble: #006FEE;

  --text-primary:        #11181C;
  --text-secondary:      #687076;
  --text-on-primary:     #FFFFFF;

  --border-color:        #E4E4E7;
  --border-color-light:  #F1F1F4;

  --radius-sm:     8px;
  --radius-md:     12px;
  --radius-lg:     20px;
  --radius-bubble: 18px;

  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
}
```

**Chat bubble:**

```css
.ai-bubble {
  background: var(--surface-ai-bubble);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-bubble);
  border-bottom-left-radius: 4px;
  padding: 12px 16px;
  max-width: 85%;
  box-shadow: var(--shadow-card);
  line-height: 1.6;
  font-size: 15px;
  color: var(--text-primary);
}

.user-bubble {
  background: var(--surface-user-bubble);
  border-radius: var(--radius-bubble);
  border-bottom-right-radius: 4px;
  padding: 12px 16px;
  max-width: 75%;
  color: var(--text-on-primary);
  font-size: 15px;
  align-self: flex-end;
}

/* Markdown content bên trong bubble */
.ai-bubble p { margin: 0 0 8px; }
.ai-bubble p:last-child { margin-bottom: 0; }
.ai-bubble ul, .ai-bubble ol { padding-left: 20px; margin: 8px 0; }
.ai-bubble li { margin-bottom: 4px; }
.ai-bubble strong { font-weight: 600; }
.ai-bubble .inline-code {
  background: #F1F3F5;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}
.md-link { color: var(--color-primary); text-decoration: underline; }
```

**Quick reply bar:**

```css
.quick-reply-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.quick-reply-btn {
  padding: 8px 14px;
  border: 1.5px solid var(--color-primary);
  border-radius: 20px;
  background: transparent;
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-reply-btn:hover {
  background: var(--color-primary);
  color: white;
}
```

**CarCard:**

```css
.car-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-width: 320px;
  box-shadow: var(--shadow-card);
}

.car-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.car-card-body { padding: 14px 16px; }
.car-card-name { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.car-card-price {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
}

.car-card-actions { display: flex; gap: 8px; margin-top: 12px; }

.btn-outline {
  flex: 1; padding: 8px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: white; cursor: pointer; font-size: 14px;
}

.btn-primary {
  flex: 1; padding: 8px;
  background: var(--color-primary);
  color: white; border: none;
  border-radius: var(--radius-sm);
  cursor: pointer; font-size: 14px; font-weight: 500;
}
```

---

## 8. Component Map (React)

```
<ChatWidget>                        // Container chính, quản lý phase state + session
  <ChatHeader>                      // Logo Vifa AI, status "Online", nút xoá lịch sử
    <HistoryClearButton />
  </ChatHeader>
  <MessageList>                     // Danh sách bubble, auto-scroll to bottom
    <AiBubble>                      // Tin nhắn AI — render Markdown
      <ReactMarkdown />             // Markdown renderer với remark-gfm
    </AiBubble>
    <UserBubble />                  // Tin nhắn user
    <TypingIndicator />             // 3 chấm khi đang gọi tool
    <SessionDivider />              // "Hội thoại trước" — MỚI v2.0

    // Phase-specific components
    <QuickReplyBar />               // GREETING: quick replies
    <CarCard />                     // CAR_DISCOVERY: thông số xe
    <CompareTable />                // CAR_DISCOVERY: so sánh đa mẫu (HTML table)
    <ClarifyPrompt />               // LOW_CONFIDENCE: hỏi làm rõ
    <FinanceOptionCard />           // FINANCE_QUESTION: chọn phương án
    <HandoffOptionCard />           // HANDOFF: chọn gọi lại hay đặt lịch — MỚI v2.0
    <SlotFillForm />                // INSTALLMENT: trạng thái slot
    <BankSelector />                // INSTALLMENT: chọn ngân hàng
    <InstallmentTable />            // INSTALLMENT: bảng trả góp HTML (expand/collapse)
    <PriceSummaryTable />           // FULL_PAY: bảng giá HTML
    <DisclaimerBanner />            // FINANCE: cảnh báo tham khảo
    <ContactForm />                 // HANDOFF: thu thập SĐT (gọi lại)
    <AppointmentForm />             // HANDOFF: đặt lịch xem xe — MỚI v2.0
    <HandoffConfirmCard />          // HANDOFF_DONE: xác nhận
    <OutOfScopeCard />              // GUARDRAIL: out-of-scope
    <HandoffButton />               // FAILURE: nút khẩn kết nối người thật
    <FeedbackModal />               // CORRECTION: dislike flow
  </MessageList>
  <ChatInput />                     // Text input + send button
</ChatWidget>
```

---

## 9. Tools / Function Calling Summary

| Tool | Gọi ở Phase | Input | Output |
|------|------------|-------|--------|
| `get_car_info()` | CAR_DISCOVERY | query, filters | CarInfo[] |
| `get_promotions()` | FINANCE_FULL_PAY | model, region | PriceDetail |
| `calculate_installment()` | FINANCE_INSTALLMENT | price, down%, term, rate | InstallmentResult |
| `save_lead()` | HANDOFF_COLLECT | name, phone, context, appointment? | LeadID |
| `schedule_appointment()` | HANDOFF_COLLECT (nhánh B) | lead_id, datetime, showroom_id | AppointmentConfirmation |

**Nguyên tắc:** LLM **không tự tính toán số tài chính**. Mọi con số phải từ tool. Nếu tool lỗi → hiển thị lỗi và chuyển handoff.

**Xử lý tool timeout:** Nếu tool không trả về trong 5 giây → `<TypingIndicator />` chuyển sang "Đang tải dữ liệu..." → sau 10 giây → trigger Failure path.

---

## 10. Admin Role (v2.0)

### 10.1 Dashboard — Theo dõi Signals & Metrics

Admin có giao diện tách biệt tại `/admin` với 3 tab chính:

**Tab 1 — Metrics tổng quan:**
- Metric cards: Tổng sessions / Handoff rate / Re-ask rate / Precision tài chính
- Bar chart: Sessions theo ngày trong tuần
- Donut chart: Phân bổ Phase thoát (Handoff done / Finance only / Discovery only / Rời sớm)
- Breakdown 4 Paths: Happy / Low-confidence / Failure / Correction với progress bar
- Bảng Red Flags với badge trạng thái: Ổn / Theo dõi / Cảnh báo

**Tab 2 — Lịch hẹn:** Xem mục 10.2

**Tab 3 — Signals log:**
- Bảng raw signals có thể filter theo loại: DISLIKE / OUT_OF_SCOPE / CORRECTION / FAILURE
- Mỗi row gồm: nội dung session / phase / loại / timestamp / flag
- Dữ liệu này là input trực tiếp cho vòng review hàng tuần theo Red Flags (Mục 11)

**Phân quyền Admin:**
```typescript
interface AdminUser {
  role: 'admin' | 'sales_manager' | 'read_only'
}
// admin:         full access
// sales_manager: chỉ xem Tab Lịch hẹn
// read_only:     xem tất cả, không chỉnh sửa
```

### 10.2 Appointment Sheet — Quản lý lịch hẹn

**Nguồn dữ liệu:** `save_lead()` + `schedule_appointment()` từ Phase 3A nhánh B.

**Cấu trúc bảng:**

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `appointment_id` | UUID | Auto-generated |
| `lead_id` | UUID | FK từ `save_lead()` |
| `customer_name` | string | |
| `phone` | string | Masked: 09xx xxx xxx |
| `car_model` | string | Từ `selected_car` |
| `finance_type` | enum | `FULL_PAY` \| `INSTALLMENT` \| `NONE` |
| `showroom_id` | string | |
| `showroom_name` | string | |
| `appointment_datetime` | ISO 8601 | |
| `confirmation_code` | string | 6 ký tự uppercase |
| `status` | enum | `NEW` \| `CONFIRMED` \| `PENDING` \| `CANCELLED` \| `COMPLETED` |
| `sales_assigned` | string | Sales phụ trách |
| `notes` | string | Admin ghi chú thêm |
| `created_at` | ISO 8601 | |
| `updated_at` | ISO 8601 | |

**Tính năng bảng:**
- Filter: theo showroom, theo trạng thái, theo khoảng ngày
- Search: theo tên hoặc SĐT
- Bulk action: xác nhận nhiều lịch cùng lúc
- Export: xuất CSV/Excel
- Click vào row → drawer hiển thị chi tiết conversation context

**Metric cards trên Appointment Sheet:**
- Hẹn tuần này / Đã xác nhận / Chờ xác nhận / Đã hủy
- Confirmation rate / Cancel rate

---

## 11. Red Flags & Threshold (Monitoring)

| Metric | Target | Red Flag | Nguồn dữ liệu |
|--------|--------|----------|--------------|
| Precision tài chính/chính sách | ≥ 95% | < 90% / tuần | DISLIKE + type "Sai thông tin" |
| Re-ask rate (mơ hồ) | ≤ 20% session | > 35% / tuần | Implicit: same-topic re-ask |
| Out-of-scope accuracy | ≥ 98% | < 95% / tuần | OUT_OF_SCOPE signal |
| Handoff rate sau AI trả lời | 20–40% | > 55% kèm dislike tăng | HANDOFF event |
| Slot correction rate (Finance) | ≤ 10% | > 20% / tuần | CORRECTION + re-call tool |
| Appointment confirm rate | ≥ 75% | < 60% / tuần | `schedule_appointment()` → CRM |
| Appointment → test-drive rate | TBD | Theo dõi từ tuần đầu | CRM → showroom feedback |

**Review cadence:** Mỗi thứ Hai, team Product review bảng Red Flags. Nếu bất kỳ metric nào vượt ngưỡng → tạo ticket cải thiện prompt/tool trong sprint tiếp theo.

---

## 12. Kiến trúc dữ liệu — Sơ đồ luồng tổng thể

```
User (Browser)
    │
    ├── localStorage (Chat History — Lớp 1)
    │       session_id, messages[], phase, selected_car
    │
    ▼
ChatWidget (React)
    │
    ├── Phase State Machine
    │
    ├── API Gateway
    │       │
    │       ├── /chat          → LLM (Claude) + Tool routing
    │       ├── /tools/cars    → get_car_info()
    │       ├── /tools/promo   → get_promotions()
    │       ├── /tools/calc    → calculate_installment()
    │       ├── /leads         → save_lead()
    │       └── /appointments  → schedule_appointment()
    │
    └── Analytics Service (Signal logging — Lớp 2)
            │
            ├── signals_log    (raw events)
            ├── sessions       (aggregated)
            └── appointments   (lịch hẹn)
                    │
                    └── Admin Dashboard (/admin)
                            ├── Tab: Metrics
                            ├── Tab: Lịch hẹn
                            └── Tab: Signals log
```

---

## 13. Deployment Checklist

Trước khi deploy lên production, đảm bảo các điểm sau:

- [ ] `react-markdown` và `remark-gfm` được cài và cấu hình đúng
- [ ] Tất cả Markdown table render đúng trên mobile (`overflow-x: auto`)
- [ ] `<InstallmentTable />` expand/collapse hoạt động
- [ ] localStorage save/restore session hoạt động khi reload
- [ ] LocalStorage bị clear sau 7 ngày (kiểm tra `created_at`)
- [ ] `schedule_appointment()` tool được kết nối với CRM
- [ ] PDPA checkbox bắt buộc tick mới submit được
- [ ] SĐT validation regex đúng cho số VN
- [ ] Admin route `/admin` được bảo vệ bằng auth middleware
- [ ] Phân quyền Admin / Sales Manager / Read-only hoạt động
- [ ] Signal logging ghi đúng `phase` và `signal_type`
- [ ] Red Flag alerts gửi email khi vượt ngưỡng
- [ ] Tool timeout 10 giây → Failure path hoạt động
- [ ] Disclaimer tài chính hiển thị đúng vị trí, không bị ẩn