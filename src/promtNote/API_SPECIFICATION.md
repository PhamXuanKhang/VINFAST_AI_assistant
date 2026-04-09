# VinFast AI Sales & Finance Assistant — API Specification

> **Scope:** Backend RESTful APIs cần thiết để thay thế toàn bộ mock data và client-side logic hiện tại.
> **Frontend reference:** `src/lib/mock-ai-engine.ts`, `src/lib/vinfast-data.ts`, `src/lib/finance-calculator.ts`
> **Auth:** Bearer Token (JWT) — tất cả endpoint `/api/v1/*` yêu cầu `Authorization: Bearer <token>`

---

## Mức ưu tiên (Priority Legend)

| Priority | Symbol | Mô tả |
|----------|--------|-------|
| **P0 — Critical** | 🔴 | Core flow không thể thiếu. App không chạy được nếu thiếu |
| **P1 — High** | 🟠 | Feature chính, cần có trong v1.0 |
| **P2 — Medium** | 🟡 | Cải thiện UX, có thể fallback client-side tạm |
| **P3 — Low** | 🟢 | Nice-to-have, dành cho v2.0+ |

---

## 1. 🔴 Chat / AI Conversation API

> **Trả lời:** Thay thế toàn bộ `mock-ai-engine.ts`
> **Backend:** LLM Agent (GPT-4o / Claude) + Tool Calling → trả về structured response

### `POST /api/v1/chat/send`

Gửi tin nhắn người dùng và nhận phản hồi AI (streaming hoặc non-streaming).

**Request:**
```jsonc
{
  "sessionId": "string",           // UUID — cuộc hội thoại hiện tại
  "message": "string",             // Tin nhắn người dùng (plain text)
  "context": {                     // Context từ client-side state
    "phase": "idle | interviewing | recommendation | detail | financial | contact_info | booking | handoff | completed",
    "selectedCarId": "string | null",
    "userProfile": {
      "name": "string",
      "phone": "string",
      "passengers": "number",
      "monthlyKm": "number",
      "monthlyIncome": "number",
      "monthlyBudget": "number",
      "downPaymentBudget": "number"
    }
  },
  "metadata": {
    "source": "web | zalo | mobile_app",
    "utmSource": "string | null"
  }
}
```

**Response (non-streaming):**
```jsonc
{
  "success": true,
  "data": {
    "messageId": "string",          // UUID
    "content": "string",            // Text response (markdown supported)
    "phase": "recommendation",      // Phase mới sau response
    "profileUpdates": {             // AI đã extract được thêm info từ message
      "passengers": 5,
      "monthlyIncome": 25000000
    },
    "richContent": [                // Render cards trên frontend
      {
        "type": "car-cards | car-detail | finance-table | product-comparison | booking-form | contact-form | profile-card",
        "data": {}                  // Dynamic payload theo type
      }
    ],
    "quickReplies": [               // Gợi ý phản hồi nhanh
      { "label": "Xem chi tiết VF5", "value": "..." }
    ],
    "timestamp": "2025-01-18T10:30:00+07:00"
  }
}
```

**Response (streaming — SSE):**
```
event: phase
data: {"phase": "recommendation"}

event: content
data: {"delta": "Với nhu cầu 5 người"}

event: rich_content
data: {"type": "car-cards", "data": [...]}

event: done
data: {"messageId": "abc-123"}
```

**Mapping frontend hiện tại:**
- `mock-ai-engine.ts:generateMockResponse()` → gọi API này
- Response `richContent.type` mapping trực tiếp vào `chat-message.tsx:RichContentRenderer`

---

### `GET /api/v1/chat/sessions`

Lấy lịch sử cuộc hội thoại của user.

**Query params:** `?page=1&limit=20&status=active`

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "string",
        "status": "active | completed | abandoned",
        "lastMessage": "string",
        "phase": "financial",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 42 }
  }
}
```

**Priority:** 🟡 P2 — Cần khi implement chat history persistence

---

### `GET /api/v1/chat/sessions/:sessionId/messages`

Load lại toàn bộ tin nhắn của 1 session (khi user reload page).

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "sessionId": "string",
    "phase": "financial",
    "userProfile": {},
    "messages": [
      {
        "id": "string",
        "sender": "user | ai | system",
        "content": "string",
        "richContent": [],
        "timestamp": "ISO date"
      }
    ]
  }
}
```

**Priority:** 🟡 P2 — Cần khi implement session persistence

---

## 2. 🔴 Vehicle Catalog API

> **Trả lời:** Thay thế `vinfast-data.ts:carModels[]`

### `GET /api/v1/vehicles`

Lấy danh sách xe. Hỗ trợ filter và pagination.

**Query params:**
```
?category=city|compact-suv|suv        // Filter theo category
?minSeats=5                           // Filter tối thiểu số chỗ
?minRange=200                         // Filter tối thiểu tầm vãng
?minPrice=200000000                   // Filter giá tối thiểu
?maxPrice=1000000000                  // Filter giá tối đa
?available=true                       // Chỉ xe có sẵn
?sort=price_asc|price_desc|range_desc // Sắp xếp
?page=1&limit=20
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "vf5-plus",
        "name": "VF 5",
        "variant": "Plus",
        "fullName": "VF 5 Plus",
        "category": "city",
        "seats": 5,
        "range": 301,
        "batteryCapacity": 37.2,
        "motorPower": 110,
        "motorTorque": 180,
        "topSpeed": 150,
        "acceleration": "6.7 giây",
        "fastChargeTime": "36 phút (10-80%)",
        "homeChargeTime": "~5 giờ (0-100%)",
        "chargingPowerDC": "47 kW",
        "bodyDimensions": { "length": 3875, "width": 1728, "height": 1583 },
        "wheelbase": 2527,
        "groundClearance": 178,
        "wheelSize": "17 inch",
        "trunkCapacity": 270,
        "weight": 1315,
        "priceOnRoad": 538000000,
        "priceBeforeTax": 470000000,
        "batteryWarrantyYears": 10,
        "vehicleWarrantyYears": 10,
        "drivetrain": "FWD (Dẫn động cầu trước)",
        "suspension": "Trước: MacPherson - Sau: Thanh xoắn",
        "braking": "Đĩa trước/sau, hỗ trợ ABS + EBD",
        "images": {
          "hero": "https://cdn.vinfast.ai/vf5/hero.webp",
          "front": "https://cdn.vinfast.ai/vf5/front.webp",
          "side": "https://cdn.vinfast.ai/vf5/side.webp",
          "interior": "https://cdn.vinfast.ai/vf5/interior.webp",
          "colors": ["#004cc3", "#1a1c1f", "#ffffff"]
        },
        "features": ["Màn hình cảm ứng 10.6 inch", "Camera 360°", "..."],
        "bestFor": ["Di chuyển hàng ngày trong phố", "..."],
        "pros": ["Giá thành dễ tiếp cận nhất", "..."],
        "cons": ["Khoang hành lý khiêm tốn (270L)", "..."],
        "description": "VF 5 Plus là mẫu xe điện đô thị...",
        "available": true,
        "showroomAvailable": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 4 }
  }
}
```

**Priority:** 🔴 P0 — Cột sống của app. CarCard, CarDetailCard, ProductComparison đều phụ thuộc

---

### `GET /api/v1/vehicles/:id`

Lấy chi tiết 1 xe. Response giống element trong list nhưng đầy đủ hơn.

**Response:** Giống object trong list, thêm field:
```jsonc
{
  "success": true,
  "data": {
    // ... all fields from list
    "colorOptions": [
      { "name": "Xanh King Blue", "hex": "#004cc3", "image": "url" },
      { "name": "Đen", "hex": "#1a1c1f", "image": "url" }
    ],
    "compatibleAccessories": ["id-acc-1", "id-acc-2"]
  }
}
```

**Priority:** 🔴 P0

---

## 3. 🟠 Finance Calculator API

> **Trả lời:** Thay thế `finance-calculator.ts` — tất cả pure functions: `calculateLoan()`, `calculateFullPayment()`, `findOptimalLoan()`

### `POST /api/v1/finance/calculate`

Tính toán chi phí sở hữu xe (trả góp hoặc trả thẳng).

**Request:**
```jsonc
{
  "vehicleId": "vf5-plus",
  "paymentType": "loan | full",       // full = mua thẳng
  "monthlyKm": 1500,                  // Quãng đường hàng tháng
  "monthlyIncome": 25000000,          // Thu nhập (để đánh giá khả năng chi trả)
  // Chỉ khi paymentType === "loan":
  "downPaymentPercent": 30,           // % trả trước (optional — nếu null, auto optimize)
  "loanTermMonths": 84,               // Số tháng góp (optional — nếu null, auto optimize)
  "preferredMonthlyBudget": 12000000, // Ngân sách mong muốn (optional — dùng cho auto optimize)
  "preferredBank": "VPBank"           // Ngân hàng ưu tiên (optional)
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "carId": "vf5-plus",
    "carName": "VF 5 Plus",
    "paymentType": "loan",
    "downPayment": 161400000,
    "loanAmount": 376600000,
    "monthlyPayment": 5912000,
    "monthlyElectricity": 780000,
    "monthlyInsurance": 672500,
    "totalMonthlyCost": 7365000,
    "interestRate": 8.5,
    "loanTerm": 84,
    "bankName": "VPBank",
    "totalLoanCost": 496608000,
    "totalInterest": 120008000,
    "electricityPerKm": 520,
    "affordability": "affordable",     // affordable | tight | overbudget
    "affordabilityRatio": 0.29         // totalMonthly / monthlyIncome
  }
}
```

**Mapping frontend hiện tại:**
- `finance-calculator.ts:calculateLoan()` → API này
- Response render trực tiếp vào `finance-table.tsx`

**Priority:** 🟠 P1 — Có thể tạm giữ client-side calculation, nhưng backend cần để đảm bảo tính nhất quán giá/lãi suất

---

### `POST /api/v1/finance/optimize`

Tìm gói vay tối ưu nhất dựa trên ngân sách.

**Request:**
```jsonc
{
  "vehicleId": "vf5-plus",
  "monthlyKm": 1500,
  "monthlyIncome": 25000000,
  "maxDownPayment": 300000000,
  "preferredMonthlyBudget": 12000000
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "bestOption": { /* FinanceResult — giống trên */ },
    "alternatives": [                  // 2-3 phương án khác
      {
        "paymentType": "loan",
        "downPayment": 134600000,
        "monthlyPayment": 7500000,
        "totalMonthlyCost": 8950000,
        "loanTerm": 60,
        "bankName": "Techcombank",
        "affordability": "tight"
      }
    ]
  }
}
```

**Priority:** 🟡 P2 — `findOptimalLoan()` client-side đang hoạt động tốt, API này giúp backend control logic

---

### `GET /api/v1/finance/loan-packages`

Lấy danh sách gói vay từ ngân hàng đối tác.

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "packages": [
      {
        "bank": "VPBank",
        "interestRate": 8.5,
        "maxTerm": 84,
        "minDownPayment": 20,
        "description": "Gói vay ưu đãi VinFast - VPBank",
        "promotions": ["Miễn phí trả trước 0đ", "Quà tặng phụ kiện 10tr"],
        "validUntil": "2025-06-30"
      }
    ]
  }
}
```

**Priority:** 🟡 P2

---

## 4. 🟠 Showroom & Booking API

> **Trả lời:** Thay thế `vinfast-data.ts:showrooms[]` + `booking-form.tsx` logic

### `GET /api/v1/showrooms`

Lấy danh sách showroom.

**Query params:**
```
?city=Hà Nội
?district=Cầu Giấy
?hasTestDrive=true
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "showrooms": [
      {
        "id": "showroom-long-bien",
        "name": "VinFast Showroom Long Biên",
        "address": "Số 7, đường Nguyễn Văn Cừ, phường Gia Thụy, quận Long Biên",
        "district": "Long Biên",
        "city": "Hà Nội",
        "phone": "1900 23 23 86",
        "openHours": "08:00 - 20:00",
        "lat": 20.9897,
        "lng": 105.8643,
        "images": ["url"],
        "availableVehicles": ["vf3", "vf5-plus", "vf6-plus"],
        "hasTestDrive": true
      }
    ]
  }
}
```

**Priority:** 🟠 P1

---

### `GET /api/v1/showrooms/:id/availability`

Lấy slot thời gian đặt lịch lái thử.

**Query params:**
```
?dateFrom=2025-01-18
?dateTo=2025-01-25
?vehicleId=vf5-plus               // Optional — filter xe có sẵn để lái thử
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "showroomId": "showroom-long-bien",
    "slots": [
      {
        "date": "2025-01-18",
        "dayOfWeek": "Thứ Bảy",
        "timeSlots": [
          { "time": "09:00", "available": true, "remaining": 3 },
          { "time": "10:00", "available": true, "remaining": 1 },
          { "time": "11:00", "available": false, "reason": "Đã đầy" }
        ]
      }
    ]
  }
}
```

**Priority:** 🟠 P1

---

### `POST /api/v1/bookings`

Tạo đặt lịch lái thử.

**Request:**
```jsonc
{
  "sessionId": "string",              // Liên kết với chat session
  "showroomId": "showroom-long-bien",
  "vehicleId": "vf5-plus",            // Optional
  "date": "2025-01-18",
  "timeSlot": "09:00",
  "customer": {
    "name": "Nguyễn Văn Minh",
    "phone": "0912345678",
    "email": "minh@example.com"       // Optional
  },
  "notes": "Quan tâm VF5 Plus, muốn test đường đô thị", // Optional
  "preferences": {
    "testRoute": "city | highway | both",
    "needConsultant": true
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "bookingId": "bk-abc123",
    "status": "confirmed",            // confirmed | pending | waitlisted
    "showroom": { "name": "...", "address": "...", "phone": "..." },
    "scheduledAt": "2025-01-18T09:00:00+07:00",
    "vehicle": { "id": "vf5-plus", "fullName": "VF 5 Plus" },
    "confirmationMessage": "Nhân viên tư vấn sẽ gọi xác nhận trước 2 tiếng.",
    "reminders": [
      { "type": "sms", "sendAt": "2025-01-17T21:00:00+07:00" },
      { "type": "zalo", "sendAt": "2025-01-18T07:00:00+07:00" }
    ]
  }
}
```

**Priority:** 🟠 P1

---

### `GET /api/v1/bookings/:id`

Check trạng thái booking.

**Priority:** 🟡 P2

---

### `POST /api/v1/bookings/:id/cancel`

Hủy booking.

**Priority:** 🟡 P2

---

## 5. 🟡 Recommendation API

> **Trả lời:** Thay thế `vinfast-data.ts:getRecommendedCars()`

### `POST /api/v1/recommend`

Gợi ý xe phù hợp dựa trên nhu cầu người dùng.

**Request:**
```jsonc
{
  "criteria": {
    "passengers": 4,
    "monthlyKm": 1500,
    "budgetMonthly": 12000000,
    "budgetTotal": 800000000,
    "usage": ["Đi làm hàng ngày", "Chở gia đình cuối tuần"],
    "preferredCategories": ["city", "compact-suv"]
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "vehicle": { /* full CarModel object */ },
        "matchScore": 92,
        "matchReasons": [
          "Phù hợp 4 người ngồi",
          "Tầm vãng 301km vượt xa nhu cầu 50km/ngày",
          "Tổng chi phí tháng 7.3tr nằm trong ngân sách 12tr"
        ],
        "alternatives": []
      }
    ]
  }
}
```

**Priority:** 🟡 P2 — Client-side filter (`getRecommendedCars()`) đang hoạt động tốt. Backend API giúp cải thiện scoring bằng ML/Collaborative filtering

---

## 6. 🟡 Customer Profile API

> **Trả lời:** Thay thế `contact-form.tsx` submit logic + `profile-card.tsx`

### `POST /api/v1/customers/lead`

Lưu thông tin khách hàng (từ chat form hoặc landing page).

**Request:**
```jsonc
{
  "sessionId": "string",
  "source": "chat_widget | landing_page | zalo",
  "name": "Nguyễn Văn Minh",
  "phone": "0912345678",
  "email": "minh@example.com",
  "interests": {
    "vehicleId": "vf5-plus",
    "budgetRange": "500tr - 800tr",
    "preferredTestDriveDate": "2025-01-20"
  },
  "metadata": {
    "utmSource": "facebook",
    "utmCampaign": "vf5_launch_2025"
  }
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "leadId": "lead-xyz789",
    "status": "new",                  // new | contacted | qualified | converted
    "assignedSales": null             // Chưa phân bổ
  }
}
```

**Priority:** 🟡 P2 — Lead capture quan trọng cho sales team, nhưng có thể tạm lưu client-side

---

### `POST /api/v1/customers/lead/:id/handoff`

Chuyển thông tin cho nhân viên sale (live handoff).

**Request:**
```jsonc
{
  "sessionId": "string",
  "channel": "phone | zalo | chat_live"
}
```

**Response:**
```jsonc
{
  "success": true,
  "data": {
    "handoffId": "ho-abc123",
    "sales": {
      "name": "Anh Tuấn",
      "phone": "0911222333",
      "avatar": "url",
      "estimatedResponseTime": "5 phút"
    },
    "summary": "Khách quan tâm VF5 Plus, thu nhập 25tr, ngân sách 12tr/tháng. Đã tính chi phí trả góp."
  }
}
```

**Priority:** 🟡 P2

---

## 7. 🟢 Analytics & Tracking API

### `POST /api/v1/analytics/event`

Gửi event tracking (page view, button click, chat interaction).

**Request:**
```jsonc
{
  "sessionId": "string",
  "eventType": "chat_message_sent | vehicle_viewed | finance_calculated | booking_created | booking_cancelled",
  "eventData": {
    "vehicleId": "vf5-plus",
    "message": "Tính chi phí VF5"
  },
  "timestamp": "ISO date"
}
```

**Priority:** 🟢 P3

---

### `GET /api/v1/analytics/conversations`

Dashboard analytics cho admin (thống kê hội thoại, conversion rate).

**Priority:** 🟢 P3

---

## 8. 🟢 Notification API

### `POST /api/v1/notifications/send`

Gửi SMS/Zalo notification (booking confirmation, reminder).

**Priority:** 🟢 P3 — Có thể dùng third-party (Twilio, Zalo OA) trực tiếp

---

## API Dependency Graph

```
🔴 POST /api/v1/chat/send              ← Core, gọi các API khác qua internal tool calling
│
├─→ Internal: vehicles.get()           ← GET /api/v1/vehicles
├─→ Internal: finance.calculate()      ← POST /api/v1/finance/calculate
├─→ Internal: recommend()              ← POST /api/v1/recommend
├─→ Internal: showrooms.availability() ← GET /api/v1/showrooms/:id/availability
│
🟠 POST /api/v1/finance/calculate
🟠 GET  /api/v1/vehicles
🟠 GET  /api/v1/showrooms
🟠 POST /api/v1/bookings
│
🟡 POST /api/v1/recommend
🟡 POST /api/v1/customers/lead
🟡 GET  /api/v1/chat/sessions
🟡 GET  /api/v1/chat/sessions/:id/messages
│
🟢 POST /api/v1/analytics/event
🟢 POST /api/v1/notifications/send
```

---

## Changelog / Versioning

### v1.0 MVP — API bắt buộc:
- `POST /api/v1/chat/send` 🔴
- `GET /api/v1/vehicles` 🔴
- `GET /api/v1/vehicles/:id` 🔴
- `POST /api/v1/finance/calculate` 🟠
- `GET /api/v1/showrooms` 🟠
- `POST /api/v1/bookings` 🟠

### v1.1 Persistence:
- `GET /api/v1/chat/sessions` 🟡
- `GET /api/v1/chat/sessions/:id/messages` 🟡
- `POST /api/v1/customers/lead` 🟡

### v2.0 Intelligence:
- `POST /api/v1/recommend` 🟡
- `POST /api/v1/finance/optimize` 🟡
- `POST /api/v1/customers/lead/:id/handoff` 🟡

### v3.0 Scale:
- Analytics, Notifications 🟢
