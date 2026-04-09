# VinFast AI Sales & Finance Assistant — Agent & Tool Calling Specification

> **Scope:** Các AI Agent và Tool/Function cần thiết để build backend cho VFA-SFA.
> **Current state:** Toàn bộ logic AI nằm trong `src/lib/mock-ai-engine.ts` bằng regex/keyword matching (chạy client-side).
> **Target state:** LLM-powered Agent architecture với Tool Calling, chạy server-side.

---

## Mức ưu tiên (Priority Legend)

| Priority | Symbol | Mô tả |
|----------|--------|-------|
| **P0 — Critical** | 🔴 | Agent/Tool bắt buộc — không có thì app không hoạt động |
| **P1 — High** | 🟠 | Core experience — cần có trong v1.0 để vượt xa mock engine |
| **P2 — Medium** | 🟡 | Nâng cao AI quality — có thể dùng rule-based fallback tạm |
| **P3 — Low** | 🟢 | Advanced automation — dành cho v2.0+ |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Orchestration Layer                     │
│              (LangChain / LlamaIndex / Custom)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │   Router     │──→│   Intent     │──→│   State      │ │
│  │   Agent      │   │   Classifier │   │   Manager    │ │
│  │  (P0)        │   │  (P0)        │   │  (P0)        │ │
│  └──────────────┘   └──────────────┘   └──────┬───────┘ │
│                                                │         │
│         ┌──────────────────────────────────────┘         │
│         ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐│
│  │                   Tool Registry                       ││
│  ├──────────┬──────────┬──────────┬──────────┬─────────┤│
│  │ Vehicle  │ Finance  │ Recommend│ Booking  │ Profile ││
│  │ Tools 🟠 │ Tools 🟠 │ Tool 🟡  │ Tools 🟠 │ Tools 🟡││
│  └──────────┴──────────┴──────────┴──────────┴─────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │                   Response Builder                    ││
│  │   Text + RichContent[] + Phase Transition           ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Agent 1: 🔴 Router Agent

**Role:** Nhận tin nhắn đầu vào → phân loại intent → điều hướng đến handler phù hợp.

**Input:**
- `message`: string — tin nhắn người dùng
- `chatHistory`: Message[] — lịch sử hội thoại
- `currentPhase`: ChatPhase — trạng thái hiện tại

**Output:**
- `intent`: enum — phân loại ý định
- `entities`: object — thông tin đã extract (car mention, numbers, etc.)
- `confidence`: number — độ tin cậy (0-1)
- `nextAction`: tool to call hoặc direct response

**Hiện tại trong codebase:** Toàn bộ logic này nằm trong `mock-ai-engine.ts:generateMockResponse()` — dùng regex chains:

```typescript
// mock-ai-engine.ts — Pattern matching hiện tại (cần thay bằng LLM)
if (/đặt lịch|lái thử|test drive|showroom/i.test(msg))  → booking
if (/so sánh|compare|vf5.*vf6/i.test(msg))               → comparison
if (/chi tiết|thông số|spec/i.test(msg))                  → detail
if (/tính|chi phí|góp|trả góp/i.test(msg))                → finance
if (/tìm xe|gợi ý|đề xuất/i.test(msg))                   → recommend
const carMention = detectCarMention(msg)                  → car lookup
```

**LLM Prompt Structure:**
```
Bạn là router cho VinFast AI Sales Assistant.

## Current Phase: {phase}
## User Profile: {profile}
## Selected Car: {selectedCar}
## Chat History (last 5): {history}

## User Message: "{message}"

## Phân loại intent theo categories sau:
- GREETING: Xin chào, hello
- VEHICLE_INQUIRY: Hỏi về xe cụ thể (VF5, VF6...)
- RECOMMENDATION_REQUEST: Tìm xe, gợi ý xe
- PRODUCT_COMPARISON: So sánh xe
- FINANCE_CALCULATION: Tính chi phí, trả góp
- BOOKING_REQUEST: Đặt lịch lái thử
- CONTACT_INFO: Cung cấp tên/SĐT
- HANDOFF_REQUEST: Chuyển sale
- GENERAL_QUESTION: Câu hỏi chung
- OUT_OF_SCOPE: Ngoài phạm vi

## Extract entities:
- mentionedCars: ["VF5", "VF6"] (nếu có)
- numbers: { passengers: 4, monthlyKm: 1500, monthlyIncome: 25000000, ... }
- name: "Minh" (nếu có)
- phone: "0912345678" (nếu có)

## Output JSON format:
{ "intent": "...", "entities": {...}, "confidence": 0.95, "nextAction": "..." }
```

**Priority:** 🔴 P0 — Là gateway của toàn bộ hệ thống. Không có thì không có AI.

---

## Agent 2: 🔴 State Manager

**Role:** Quản lý state machine của cuộc hội thoại, quyết định khi nào chuyển phase.

**Hiện tại trong codebase:** `mock-ai-engine.ts:generatePhaseResponse()` + `chat-store.ts:ChatPhase`

```
State Machine hiện tại:
idle → interviewing → recommendation → detail → financial → contact_info → booking → handoff → completed
```

**Rules:**
```
TRANSITION RULES:
─────────────────
idle + GREETING           → interviewing
interviewing + đủ profile → recommendation
interviewing + thiếu info → interviewing (hỏi thêm)
recommendation + chọn xe  → detail
detail + hỏi chi phí      → financial
financial + chưa có info  → contact_info
contact_info + submit     → booking
booking + confirm         → handoff/completed
handoff + done            → completed
completed + greeting      → idle (reset)

GUARD CONDITIONS:
─────────────────
booking    → YÊU CẦU: name && phone
handoff    → YÊU CẦU: selectedCar || financeResult
financial  → YÊU CẦU: selectedCar
```

**Implementation:** Có thể implement bằng:
- **Option A:** Rule-based state machine (simple, determinisitic) — phù hợp v1.0
- **Option B:** LLM-based với system prompt chứa rules — linh hoạt hơn
- **Option C:** Hybrid — rule-based transitions + LLM cho edge cases

**Priority:** 🔴 P0

---

## Agent 3: 🔴 Profile Extractor

**Role:** Extract structured user information từ tin nhắn tự nhiên (tiếng Việt).

**Hiện tại trong codebase:** `mock-ai-engine.ts:extractProfile()` — regex-based:

```typescript
// Regex patterns hiện tại
/(\d+)\s*(người|chỗ)/i           → passengers
/([\d.]+)\s*km/i                 → monthlyKm
/thu nhập.*([\d.]+)\s*triệu/i    → monthlyIncome
/góp.*([\d.]+)\s*triệu/i         → monthlyBudget
/tôi là\s+([A-ZÀ-Ỹ][a-z]+)/i     → name
/(0[3-9]\d{8,9})/i               → phone
```

**Limitation hiện tại:**
- ❌ Không hiểu variant: "Cho anh 25 triệu" (không có keyword "thu nhập")
- ❌ Không hiểu context: "Vợ anh cũng đi làm" → passengers không đổi
- ❌ Không handle negation: "Không muốn quá 5 chỗ"
- ❌ Không extract phone từ: "SĐT của em zero chín một hai..." (viết bằng chữ)

**LLM-based extraction prompt:**
```
Extract thông tin từ tin nhắn khách hàng tiếng Việt.

Message: "{message}"
Current Profile: {profile}

Output JSON:
{
  "name": null | "string",
  "phone": null | "string",
  "passengers": null | number,
  "monthlyKm": null | number,
  "monthlyIncome": null | number,
  "monthlyBudget": null | number,
  "downPaymentBudget": null | number,
  "usage": null | string[],
  "notes": "bất kỳ context thêm nào"
}
```

**Priority:** 🔴 P0 — Trực tiếp ảnh hưởng đến chất lượng recommendation và finance calculation

---

## Tool 1: 🟠 `search_vehicles`

**Mô tả:** Tìm kiếm và lọc danh sách xe VinFast.

**When Agent calls:** Khi user hỏi về xe, cần recommendation, hoặc so sánh.

**Parameters:**
```jsonc
{
  "query": "xe 5 chỗ giá rẻ",        // Natural language query (optional)
  "filters": {
    "category": "city | compact-suv | suv",
    "minSeats": 4,
    "maxSeats": 7,
    "minRange": 200,
    "maxRange": 500,
    "minPrice": 0,
    "maxPrice": 1000000000,
    "available": true
  },
  "sort": "price_asc | price_desc | range_desc | relevance",
  "limit": 5
}
```

**Returns:**
```jsonc
{
  "vehicles": [
    {
      "id": "vf5-plus",
      "fullName": "VF 5 Plus",
      "category": "city",
      "seats": 5,
      "range": 301,
      "priceOnRoad": 538000000,
      "keySpecs": { "motorPower": 110, "batteryCapacity": 37.2, "topSpeed": 150 },
      "features": ["Màn hình 10.6 inch", "Camera 360°", "..."],
      "bestFor": ["Đi làm hàng ngày", "..."],
      "available": true
    }
  ],
  "total": 3
}
```

**Mapping:** Thay thế `vinfast-data.ts:carModels.filter()` + `getRecommendedCars()`

**Priority:** 🟠 P1

---

## Tool 2: 🟠 `get_vehicle_detail`

**Mô tả:** Lấy thông tin chi tiết đầy đủ của một mẫu xe.

**When Agent calls:** Khi user hỏi "chi tiết VF5", "thông số VF6", hoặc cần render CarDetailCard.

**Parameters:**
```jsonc
{
  "vehicleId": "vf5-plus"             // Bắt buộc
}
```

**Returns:** Full CarModel object (xem API Specification — `GET /api/v1/vehicles/:id`)

**Mapping:** Thay thế `vinfast-data.ts:getCarById()` + `mock-ai-engine.ts:generateDetailResponse()`

**Priority:** 🟠 P1

---

## Tool 3: 🟠 `compare_vehicles`

**Mô tả:** So sánh 2 mẫu xe side-by-side theo thông số kỹ thuật.

**When Agent calls:** Khi user nói "so sánh VF5 và VF6", "VF8 vs VF6", hoặc muốn compare.

**Parameters:**
```jsonc
{
  "vehicleId1": "vf5-plus",
  "vehicleId2": "vf6-plus",
  "focusAreas": [                   // Optional — areas user quan tâm
    "performance | range | comfort | safety | price | technology"
  ]
}
```

**Returns:**
```jsonc
{
  "comparison": {
    "vehicle1": { "id": "vf5-plus", "fullName": "VF 5 Plus", "..." },
    "vehicle2": { "id": "vf6-plus", "fullName": "VF 6 Plus", "..." },
    "sideBySide": [
      { "spec": "Tầm vãng", "v1": "301 km", "v2": "399 km", "winner": "vehicle2" },
      { "spec": "Chỗ ngồi", "v1": "5", "v2": "5", "winner": "tie" },
      { "spec": "Mô-tơ", "v1": "110 HP", "v2": "150 HP", "winner": "vehicle2" },
      // ... 15+ specs
    ],
    "summary": {
      "vehicle1Advantages": ["Giá rẻ hơn", "Nặng nhẹ dễ đỗ"],
      "vehicle2Advantages": ["Tầm vãng xa hơn", "Nội thất cao cấp hơn"],
      "bestFor": {
        "vehicle1": "Người mới chuyển xe điện, ngân sách vừa phải",
        "vehicle2": "Gia đình cần không gian rộng, công nghệ an toàn"
      }
    }
  }
}
```

**Mapping:** Thay thế `mock-ai-engine.ts:generateComparisonResponse()` + `product-comparison.tsx` data

**Priority:** 🟠 P1

---

## Tool 4: 🟠 `calculate_finance`

**Mô tả:** Tính toán chi phí sở hữu xe (trả góp hoặc mua thẳng).

**When Agent calls:** Khi user hỏi về giá, chi phí, trả góp, hoặc sau khi đã recommend xong.

**Parameters:**
```jsonc
{
  "vehicleId": "vf5-plus",
  "paymentType": "loan",            // "loan" | "full"
  "monthlyKm": 1500,
  "monthlyIncome": 25000000,
  // Optional — nếu không có, system tự optimize:
  "downPaymentPercent": 30,
  "loanTermMonths": 84,
  "bankPreference": "VPBank"
}
```

**Returns:**
```jsonc
{
  "result": {
    "paymentType": "loan",
    "downPayment": 161400000,
    "monthlyPayment": 5912000,
    "monthlyElectricity": 780000,
    "monthlyInsurance": 672500,
    "totalMonthlyCost": 7365000,
    "totalLoanCost": 496608000,
    "totalInterest": 120008000,
    "affordability": "affordable",
    "bankName": "VPBank",
    "interestRate": 8.5,
    "loanTerm": 84
  },
  "explanation": "Với thu nhập 25tr/tháng, trả góp VF5 Plus qua VPBank: trả trước 161tr, mỗi tháng ~7.3tr (gồm góp + điện + bảo hiểm). Chi phí nằm trong khả năng chi trả."
}
```

**Mapping:** Thay thế `finance-calculator.ts` toàn bộ (EVN tiered pricing, loan calc, affordability)

**Priority:** 🟠 P1

---

## Tool 5: 🟠 `find_optimal_loan`

**Mô tả:** Tìm gói vay tối ưu nhất dựa trên ngân sách và thu nhập.

**When Agent calls:** Khi user nói "tìm gói phù hợp nhất", "tối ưu chi phí", hoặc agent tự gọi để recommend.

**Parameters:**
```jsonc
{
  "vehicleId": "vf5-plus",
  "monthlyKm": 1500,
  "monthlyIncome": 25000000,
  "maxDownPayment": 300000000,
  "preferredMonthlyBudget": 12000000
}
```

**Returns:**
```jsonc
{
  "bestOption": { /* FinanceResult */ },
  "alternatives": [
    { "bankName": "Techcombank", "loanTerm": 60, "totalMonthlyCost": 8950000, "affordability": "tight" }
  ],
  "recommendation": "Gói VPBank 84 tháng là tối ưu nhất vì tổng chi phí tháng 7.3tr, nằm trong ngân sách 12tr và có margin dự phòng."
}
```

**Mapping:** Thay thế `finance-calculator.ts:findOptimalLoan()`

**Priority:** 🟡 P2 — Tool 4 `calculate_finance` có thể handle basic case

---

## Tool 6: 🟠 `search_showrooms`

**Mô tả:** Tìm showroom gần user hoặc theo khu vực.

**When Agent calls:** Khi user muốn đặt lịch lái thử hoặc hỏi về showroom.

**Parameters:**
```jsonc
{
  "city": "Hà Nội",                // Optional
  "district": "Long Biên",         // Optional
  "nearLat": 20.98,                // Optional — GPS
  "nearLng": 105.86,
  "maxDistanceKm": 15,
  "vehicleId": "vf5-plus"          // Optional — chỉ showroom có xe này
}
```

**Returns:**
```jsonc
{
  "showrooms": [
    {
      "id": "showroom-long-bien",
      "name": "VinFast Showroom Long Biên",
      "address": "...",
      "district": "Long Biên",
      "city": "Hà Nội",
      "phone": "1900 23 23 86",
      "openHours": "08:00 - 20:00",
      "distanceKm": 3.2,
      "availableVehicles": ["vf3", "vf5-plus", "vf6-plus"]
    }
  ]
}
```

**Mapping:** Thay thế `vinfast-data.ts:showrooms[]`

**Priority:** 🟠 P1

---

## Tool 7: 🟠 `get_showroom_availability`

**Mô tả:** Lấy slot thời gian trống của showroom.

**When Agent calls:** Khi user chọn showroom và cần chọn ngày/giờ đặt lịch.

**Parameters:**
```jsonc
{
  "showroomId": "showroom-long-bien",
  "dateFrom": "2025-01-18",
  "dateTo": "2025-01-25",
  "vehicleId": "vf5-plus"          // Optional
}
```

**Returns:**
```jsonc
{
  "slots": [
    {
      "date": "2025-01-18",
      "dayOfWeek": "Thứ Bảy",
      "timeSlots": [
        { "time": "09:00", "available": true, "remaining": 3 },
        { "time": "11:00", "available": false }
      ]
    }
  ]
}
```

**Mapping:** Thay thế `showrooms[].availableSlots`

**Priority:** 🟠 P1

---

## Tool 8: 🟠 `create_booking`

**Mô tả:** Tạo đặt lịch lái thử.

**When Agent calls:** Khi user đã chọn showroom + date + time và xác nhận.

**Parameters:**
```jsonc
{
  "sessionId": "uuid",
  "showroomId": "showroom-long-bien",
  "vehicleId": "vf5-plus",
  "date": "2025-01-18",
  "timeSlot": "09:00",
  "customerName": "Nguyễn Văn Minh",
  "customerPhone": "0912345678",
  "customerEmail": "optional",
  "notes": "Muốn test đường đô thị"
}
```

**Returns:**
```jsonc
{
  "bookingId": "bk-abc123",
  "status": "confirmed",
  "showroomName": "VinFast Showroom Long Biên",
  "scheduledAt": "2025-01-18T09:00:00+07:00",
  "confirmationMessage": "Đã đặt lịch thành công! Nhân viên sẽ gọi xác nhận trước 2 tiếng."
}
```

**Mapping:** Thay thế `booking-form.tsx:handleConfirm()` logic

**Priority:** 🟠 P1

---

## Tool 9: 🟡 `save_customer_lead`

**Mô tả:** Lưu thông tin khách hàng vào CRM/lead database.

**When Agent calls:** Khi user submit contact form (tên + SĐT).

**Parameters:**
```jsonc
{
  "sessionId": "uuid",
  "name": "Nguyễn Văn Minh",
  "phone": "0912345678",
  "email": "optional",
  "interests": {
    "vehicleId": "vf5-plus",
    "budgetRange": "500tr-800tr"
  },
  "conversationSummary": "Khách quan tâm VF5 Plus cho gia đình 4 người, thu nhập 25tr..."
}
```

**Mapping:** Thay thế `contact-form.tsx` submit + `profile-card.tsx`

**Priority:** 🟡 P2

---

## Tool 10: 🟡 `handoff_to_sales`

**Mô tả:** Chuyển cuộc hội thoại cho nhân viên sales.

**When Agent calls:** Khi user nói "chuyển sale", "gặp nhân viên", hoặc sau khi booking xong.

**Parameters:**
```jsonc
{
  "sessionId": "uuid",
  "channel": "phone | zalo | live_chat",
  "reason": "customer_request | post_booking | complex_query"
}
```

**Returns:**
```jsonc
{
  "handoffId": "ho-abc",
  "sales": { "name": "Anh Tuấn", "phone": "0911222333" },
  "estimatedResponseTime": "5 phút",
  "conversationSummary": "Khách: Minh, 0912xxx. Quan tâm VF5 Plus. Thu nhập 25tr, ngân sách 12tr/tháng. Đã đặt lịch lái thử 18/01."
}
```

**Mapping:** Thay thế `mock-ai-engine.ts` handoff response + `profile-card.tsx`

**Priority:** 🟡 P2

---

## Tool 11: 🟡 `get_recommendation`

**Mô tả:** Gợi ý xe phù hợp nhất dựa trên profile người dùng.

**When Agent calls:** Khi đã thu thập đủ thông tin interviewing phase và cần recommend.

**Parameters:**
```jsonc
{
  "passengers": 4,
  "monthlyKm": 1500,
  "monthlyIncome": 25000000,
  "monthlyBudget": 12000000,
  "totalBudget": 800000000,
  "usage": ["Đi làm hàng ngày", "Chở gia đình"],
  "preferredCategories": ["city", "compact-suv"]
}
```

**Returns:**
```jsonc
{
  "recommendations": [
    {
      "vehicle": { "id": "vf5-plus", "fullName": "VF 5 Plus", "..." },
      "matchScore": 92,
      "matchReasons": ["Phù hợp 4 người", "Tầm vãng vượt nhu cầu", "Chi phí trong ngân sách"],
      "estimatedMonthlyCost": 7365000
    }
  ],
  "topPick": "vf5-plus",
  "reasoning": "Dựa trên thu nhập 25tr và ngân sách 12tr/tháng, VF5 Plus là lựa chọn tối ưu vì..."
}
```

**Mapping:** Thay thế `vinfast-data.ts:getRecommendedCars()`

**Priority:** 🟡 P2 — `search_vehicles` + Agent reasoning có thể handle, nhưng dedicated tool cho quality cao hơn

---

## Tool 12: 🟡 `calculate_electricity_cost`

**Mô tả:** Tính chi phí điện sạc chi tiết (EVN tiered pricing breakdown).

**When Agent calls:** Khi user hỏi cụ thể về "tiền điện bao nhiêu", "sạc xe tốn bao nhiêu".

**Parameters:**
```jsonc
{
  "monthlyKm": 1500,
  "batteryCapacity": 37.2,
  "range": 301,
  "existingMonthlyKwh": 150        // Tiêu thụ điện gia đình hiện tại
}
```

**Returns:**
```jsonc
{
  "monthlyCost": 780000,
  "perKmCost": 520,
  "breakdown": [
    { "tier": "B2 (51-100 kWh)", "kwh": 25, "rate": 1734, "cost": 43350 },
    { "tier": "B3 (101-200 kWh)", "kwh": 50, "rate": 2014, "cost": 100700 }
  ],
  "note": "Chi phí sạc xe EV từ bậc B3 trở lên, chiếm ~25% tăng thêm so với không có xe điện."
}
```

**Mapping:** Thay thế `finance-calculator.ts:calculateElectricityCost()`

**Priority:** 🟡 P2 — Đã bao gồm trong `calculate_finance`, nhưng tách riêng cho câu hỏi chi tiết

---

## Tool 13: 🟢 `send_notification`

**Mô tả:** Gửi SMS/Zalo/email notification.

**When Agent calls:** Sau khi tạo booking thành công, nhắc lịch, v.v.

**Priority:** 🟢 P3

---

## Tool 14: 🟢 `search_web_faq`

**Mô tả:** Tìm kiếm thông tin từ FAQ/knowledge base VinFast (chính sách bảo hành, chương trình khuyến mãi, v.v.).

**When Agent calls:** Khi user hỏi câu hỏi ngoài phạm vi product/finance (VD: "bảo hành pin bao lâu?", "có chương trình trade-in không?").

**Priority:** 🟢 P3

---

## Tool 15: 🟢 `log_analytics_event`

**Mô tả:** Log analytics event cho tracking.

**When Agent calls:** Tự động gọi sau mỗi interaction quan trọng.

**Priority:** 🟢 P3

---

## Intent → Tool Mapping

Bảng mapping từ user intent đến tool(s) cần gọi:

| User Intent | Primary Tool | Secondary Tool | Frontend Render |
|-------------|-------------|----------------|-----------------|
| Xin chào | — (direct response) | — | — |
| Tìm xe / Gợi ý | `search_vehicles` + `get_recommendation` | `calculate_finance` | `car-cards` |
| Xem chi tiết VF5 | `get_vehicle_detail` | — | `car-detail` |
| So sánh VF5 vs VF6 | `compare_vehicles` | — | `product-comparison` |
| Tính chi phí trả góp | `calculate_finance` | `find_optimal_loan` | `finance-table` |
| Đặt lịch lái thử | `search_showrooms` → `get_showroom_availability` → `create_booking` | — | `booking-form` |
| Cung cấp tên/SĐT | `save_customer_lead` | — | `contact-form` → auto transition |
| Chuyển sale | `handoff_to_sales` | `save_customer_lead` | `profile-card` |
| Hỏi tiền điện | `calculate_electricity_cost` | — | inline text |
| FAQ bảo hành | `search_web_faq` | `get_vehicle_detail` | inline text |

---

## Conversation Flow — Agent Tool Call Sequence

### Flow 1: Full Sales Journey (Happy Path)
```
User: "Cho em tìm xe cho gia đình 4 người"
  → Router: intent=RECOMMENDATION_REQUEST
  → State: idle → interviewing
  → Tool: None (chưa đủ info)
  → Response: "Em cần biết thêm thu nhập và quãng đường..."

User: "Thu nhập 25 triệu, đi khoảng 50km/ngày"
  → Router: intent=RECOMMENDATION_REQUEST
  → Profile Extractor: { monthlyIncome: 25M, monthlyKm: 1500 }
  → State: interviewing → recommendation
  → Tool: search_vehicles(filters) + get_recommendation(profile)
  → Response + richContent: car-cards

User: "Tính chi phí VF5 Plus"
  → Router: intent=FINANCE_CALCULATION, entity: {car: "vf5-plus"}
  → State: recommendation → financial
  → Tool: calculate_finance(vf5-plus, income=25M, km=1500)
  → Response + richContent: finance-table

User: [Submit contact form]
  → Tool: save_customer_lead(name, phone)
  → State: financial → contact_info → booking
  → Response + richContent: booking-form

User: [Select showroom + time + confirm]
  → Tool: search_showrooms() → get_showroom_availability() → create_booking()
  → State: booking → completed
  → Response + richContent: profile-card
```

### Flow 2: Direct Comparison
```
User: "So sánh VF5 và VF6 cho em"
  → Router: intent=PRODUCT_COMPARISON, entities: {car1: "VF5", car2: "VF6"}
  → Tool: compare_vehicles(vf5-plus, vf6-plus)
  → Response + richContent: product-comparison
```

---

## Implementation Options

### Option A: OpenAI GPT-4o + Function Calling (Recommended v1.0)
- **Pros:** Native tool calling, mạnh cho tiếng Việt, structured output
- **Cons:** Chi phí cao, latency
- **Setup:** `openai.chat.completions.create({ model: "gpt-4o", tools: [...] })`

### Option B: Claude 3.5 Sonnet + Tool Use
- **Pros:** Long context window tốt, tool calling mạnh, rẻ hơn GPT-4o
- **Cons:** Cần careful prompt engineering cho tiếng Việt
- **Setup:** `anthropic.messages.create({ model: "claude-3-5-sonnet", tools: [...] })`

### Option C: LangChain + Local LLM (vLLM/Llama 3)
- **Pros:** Miễn phí, data privacy, control
- **Cons:** Cần GPU server, tiếng Việt weaker, tool calling quality thấp hơn
- **Setup:** `langchain.agents.createToolCallingAgent()`

### Option D: Hybrid (Recommended)
```
Router + Profile Extractor + State Manager → GPT-4o / Claude (needs intelligence)
Tools (search, calculate, booking)           → Custom code (needs accuracy + speed)
Response Builder                              → Template + LLM polish
```

---

## Priority Summary — Implementation Order

```
PHASE 1 — MVP (Không có = không chạy được):
  🔴 Router Agent
  🔴 State Manager Agent
  🔴 Profile Extractor Agent

PHASE 2 — Core Tools (v1.0 features):
  🟠 search_vehicles
  🟠 get_vehicle_detail
  🟠 compare_vehicles
  🟠 calculate_finance
  🟠 search_showrooms
  🟠 get_showroom_availability
  🟠 create_booking

PHASE 3 — Intelligence (v1.1):
  🟡 get_recommendation
  🟡 save_customer_lead
  🟡 handoff_to_sales
  🟡 find_optimal_loan
  🟡 calculate_electricity_cost

PHASE 4 — Scale (v2.0+):
  🟢 send_notification
  🟢 search_web_faq
  🟢 log_analytics_event
```
