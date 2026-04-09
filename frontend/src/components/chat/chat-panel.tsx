'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/chat-store';
import { ChatMessage } from './chat-message';
import { TypingIndicator } from './typing-indicator';
import { QuickReplies } from './quick-replies';
import { cn } from '@/lib/utils';
// Remove mock engine import

export function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping } = useChatStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto px-4 py-6 space-y-4',
          'custom-scrollbar'
        )}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-on-surface-variant text-sm">
              Bắt đầu cuộc trò chuyện...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Quick Replies */}
      <QuickReplies />

      {/* Input Area */}
      <ChatInput />
    </div>
  );
}

export async function processUserMessage(text: string) {
  const store = useChatStore.getState();
  if (store.isTyping) return;

  store.addMessage({ sender: 'user', content: text });
  store.setTyping(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: text,
        thread_id: store.threadId || undefined
      })
    });

    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    
    if (data.thread_id) {
      store.setThreadId(data.thread_id);
    }
    
    let content = data.response || "Xin lỗi, không có phản hồi từ máy chủ.";
    const richContent: any[] = [];
    
    // Parse json blocks specific for UI integration
    const jsonRegex = /```json\n([\s\S]*?)\n```/g;
    let match;
    while ((match = jsonRegex.exec(data.response)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.component) {
           let type = '';
           if (parsed.component === 'CarCard') type = 'car-card';
           else if (parsed.component === 'InstallmentTable') type = 'finance-table';
           else if (parsed.component === 'ContactForm') type = 'contact-form';
           else if (parsed.component === 'PriceSummaryCard') type = 'finance-table'; // map to finance template
           
           if (type) {
             // For car-card, the UI expects carData inside data.
             let mappedData = parsed.data;
             if (type === 'car-card') {
               // Mapping backend python data formatting to frontend carData type implicitly
                 mappedData = {
                  id: parsed.data.car_id,
                  name: parsed.data.model,
                  fullName: parsed.data.model,
                  priceOnRoad: parsed.data.retail_price_vnd,
                  price: parsed.data.retail_price_vnd,
                  range: parsed.data.range_km?.toString(),
                  acceleration: "---",
                  batteryCapacity: parsed.data.battery_kwh,
                  battery: parsed.data.battery_kwh?.toString(),
                  motorPower: parsed.data.motor_power_kw,
                  category: parsed.data.body_style,
                  seats: parsed.data.seats,
                  drivetrain: parsed.data.drivetrain,
                  image: parsed.data.image_url || "/placeholder.jpg",
                  color: "#006FEE"
               };
             }
             richContent.push({ type, data: mappedData });
           }
           
           content = content.replace(match[0], '');
        }
      } catch (e) {}
    }

    store.addMessage({
      sender: 'ai',
      content: content.trim(),
      richContent: richContent.length > 0 ? richContent : undefined,
    });
  } catch (err) {
    console.error(err);
    store.addMessage({
      sender: 'system',
      content: 'Lỗi kết nối tới server FastAPI (http://localhost:8000). Vui lòng kiểm tra lại.'
    });
  }

  store.setTyping(false);
}

function ChatInput() {
  const { isTyping } = useChatStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = inputRef.current?.value.trim();
    if (!text || isTyping) return;
    inputRef.current.value = '';
    processUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className={cn(
          'flex items-end gap-3 p-2',
          'bg-surface-container-low rounded-2xl',
          'transition-all duration-200',
          'focus-within:bg-surface-container-lowest focus-within:ambient-shadow-sm'
        )}
      >
        <textarea
          ref={inputRef}
          placeholder="Nhập tin nhắn..."
          rows={1}
          disabled={isTyping}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 resize-none bg-transparent px-3 py-2',
            'text-sm text-on-surface placeholder:text-on-surface-variant',
            'outline-none max-h-32',
            'font-[family-name:var(--font-inter)]'
          )}
          style={{
            height: 'auto',
            minHeight: '40px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={isTyping}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            'bg-primary text-primary-foreground',
            'transition-all duration-200',
            'hover:opacity-90 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'btn-primary-glow shrink-0'
          )}
          aria-label="Gửi tin nhắn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22 11 13 2 9z" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-on-surface-variant mt-2 opacity-60">
        VinFast AI Assistant — Prototype Demo
      </p>
    </div>
  );
}
