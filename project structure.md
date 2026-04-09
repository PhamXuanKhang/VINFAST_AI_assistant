# Project Structure Guide

## 1) Tra loi nhanh cho cau hoi cua ban

Frontend hien tai co the chay doc lap va KHONG anh huong truc tiep den Agent/Core/Telemetry/Tools ben Python.

Ly do:
- Frontend dang dung mock engine o client-side trong src/frontend/src/components/chat/chat-panel.tsx va src/frontend/src/lib/mock-ai-engine.ts.
- Frontend khong co API route trong src/frontend/src/app/api (thu muc nay hien khong ton tai).
- Backend Python chay rieng bang Streamlit tu app.py va goi chuoi Agent -> Core -> Tools -> Telemetry.

Noi khac: hien tai du an dang co 2 luong rieng:
- Luong A (Python Streamlit): chat tool-calling that su.
- Luong B (Next.js Frontend): prototype UI + mock logic.

## 2) Cac phan Agent/Core/Telemetry/Tools tuong tac voi nhau the nao

### Luong backend Python
1. app.py tao provider (OpenAI/Gemini/Local), khoi tao SimpleChatbot va ReActAgent.
2. src/agent/agent.py (ReActAgent) goi LLM, parse output, va goi tool khi can.
3. src/tools/registry.py dang ky 3 tools: check_stock, get_discount, calc_shipping.
4. src/tools/*.py xu ly du lieu ton kho, coupon, shipping.
5. src/core/*.py la lop adapter cho tung nha cung cap LLM.
6. src/telemetry/logger.py + src/telemetry/metrics.py ghi metric/nhat ky cho moi request.

### Luong frontend hien tai
1. src/frontend/src/app/page.tsx render giao dien.
2. src/frontend/src/components/chat/chat-panel.tsx xu ly input user.
3. chat-panel.tsx goi generateMockResponse() tu mock-ai-engine.ts.
4. Ket qua duoc luu o zustand store: src/frontend/src/store/chat-store.ts.

=> Frontend hien tai KHONG goi truc tiep den ReActAgent, tools, hoac telemetry Python.

## 3) Frontend dat trong src co anh huong gi den san pham cuoi?

Ban chat: dat trong src/frontend hay frontend/ khong thay doi logic san pham.

Anh huong thuc te:
- To chuc monorepo: can script/build path dung.
- CI/CD: can biet root frontend la src/frontend.
- Deploy: pipeline can tach backend (Python) va frontend (Next) ro rang.

Neu khong tich hop API giua 2 ben, ban se co 2 "san pham" rieng:
- 1 ban demo Python tool-calling.
- 1 ban demo UI voi mock AI.

## 4) Lam sao de thanh mot san pham hoan chinh

De xuat toi thieu:
1. Tao backend API (FastAPI/Flask) boc ReActAgent.
2. Tao endpoint vi du POST /api/chat/react nhan message + session.
3. Trong frontend, thay generateMockResponse bang fetch den endpoint tren.
4. Dong bo schema response (content, phase, richContent, telemetry optional).
5. Giu mock-ai-engine lam fallback cho demo offline.

Khi do luong se la:
Frontend UI -> API Backend -> ReActAgent -> Tools -> Telemetry -> Frontend UI.

## 5) Cach chay du an tren Windows

## 5.1 Backend Python (Streamlit)
1. Tai root project, tao va kich hoat venv:
   - python -m venv .venv
   - .venv\Scripts\Activate.ps1
2. Cai thu vien:
   - pip install -r requirements.txt
3. Tao file env:
   - Copy .env.example thanh .env va dien API key.
4. Chay app:
   - streamlit run app.py

## 5.2 Frontend Next.js
Root frontend la: src/frontend

1. Di chuyen thu muc:
   - cd src/frontend
2. Cai dependency:
   - npm install
3. Chay dev server (khuyen nghi tren Windows):
   - npx next dev -p 3000
4. Mo trinh duyet:
   - http://localhost:3000

Ghi chu:
- package.json hien co script dung tee/cp/bun theo kieu Unix, co the khong tuong thich day du voi Windows cho mode production.
- start-server.js dang hard-code duong dan Linux (/home/z/my-project), khong phu hop may Windows.

## 6) Ban do file quan trong (nen doc/can chinh o dau)

| Khu vuc | File chinh | Muc dich |
|---|---|---|
| Entry backend | app.py | UI Streamlit, khoi tao provider + agents |
| Agent logic | src/agent/agent.py | ReAct loop, parse output, goi tools |
| Basic bot | src/agent/chatbot.py | Baseline khong dung tools |
| Parsing | src/agent/parsing.py | Parse JSON action/final bang pydantic |
| LLM abstraction | src/core/llm_provider.py | Interface chung cho provider |
| OpenAI/Gemini/Local | src/core/openai_provider.py, src/core/gemini_provider.py, src/core/local_provider.py | Goi API/model tung nha cung cap |
| Tool registry | src/tools/registry.py | Dang ky tool name -> function |
| Tool implementation | src/tools/inventory.py, src/tools/coupons.py, src/tools/shipping.py | Business logic ton kho/coupon/phi ship |
| Tool data | src/tools/data.py | Catalog/coupons/allowed cities |
| Telemetry | src/telemetry/logger.py, src/telemetry/metrics.py | Log su kien va metric token/latency/cost |
| Frontend entry | src/frontend/src/app/page.tsx | Trang chinh giao dien chat |
| Frontend chat flow | src/frontend/src/components/chat/chat-panel.tsx | Xu ly input va goi mock engine |
| Frontend AI mock | src/frontend/src/lib/mock-ai-engine.ts | Sinh phan hoi client-side |
| Frontend state | src/frontend/src/store/chat-store.ts | Quan ly state toan bo hoi thoai |

## 7) Ket luan

- Frontend hien tai khong lam hong backend va cung khong su dung backend.
- Vi tri src/frontend khong phai van de; van de nam o muc do tich hop.
- Muon thanh san pham cuoi thong nhat: can bo sung API layer va doi frontend sang goi backend that.
