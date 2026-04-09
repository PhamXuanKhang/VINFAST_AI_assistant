'use client';

import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/store/chat-store';
import { CarCard } from '@/components/features/car-card';
import { CarDetailCard } from '@/components/features/car-detail-card';
import { FinanceTable } from '@/components/features/finance-table';
import { ProductComparison } from '@/components/features/product-comparison';
import { BookingForm } from '@/components/features/booking-form';
import { ContactForm } from '@/components/features/contact-form';
import { ProfileCard } from '@/components/features/profile-card';

interface ChatMessageProps { message: ChatMessageType; }

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isAI = message.sender === 'ai';

  if (isSystem) {
    return (
      <div className="flex justify-center animate-fade-in-up">
        <div className={cn('px-4 py-2 rounded-full text-xs', 'bg-surface-container text-on-surface-variant')}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex animate-fade-in-up', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex gap-2.5 max-w-[85%] md:max-w-[75%]', isUser && 'flex-row-reverse')}>
        {!isUser && (
          <div className={cn('w-8 h-8 rounded-full shrink-0 flex items-center justify-center', 'bg-primary text-primary-foreground', 'text-xs font-semibold', 'font-[family-name:var(--font-plus-jakarta)]')}>VF</div>
        )}
        <div className="flex flex-col gap-1">
          <div className={cn(
            'px-4 py-3 text-[15px] leading-relaxed',
            isUser ? cn('bg-primary text-primary-foreground bubble-user', 'font-[family-name:var(--font-inter)]') : cn('bg-surface-container-high text-on-surface bubble-ai', 'font-[family-name:var(--font-inter)]'),
            isAI && 'whitespace-pre-wrap',
          )}>
            {message.content}
          </div>
          {message.richContent && message.richContent.length > 0 && (
            <div className="mt-2 space-y-3 animate-fade-in-up">
              {message.richContent.map((rich, idx) => <RichContentRenderer key={idx} content={rich} />)}
            </div>
          )}
          <span className={cn('text-[10px] text-on-surface-variant mt-0.5', isUser ? 'text-right pr-1' : 'pl-1')}>
            {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function RichContentRenderer({ content }: { content: { type: string; data?: unknown } }) {
  switch (content.type) {
    case 'car-card':
      return <CarCard carData={content.data as Parameters<typeof CarCard>[0]['carData']} />;
    case 'car-cards':
      return <div className="space-y-3">{Array.isArray(content.data) && (content.data as Parameters<typeof CarCard>[0]['carData'][]).map((car, i) => <CarCard key={i} carData={car} />)}</div>;
    case 'car-detail':
      return <CarDetailCard carData={content.data as Parameters<typeof CarDetailCard>[0]['carData']} />;
    case 'finance-table':
      return <FinanceTable data={content.data as Parameters<typeof FinanceTable>[0]['data']} />;
    case 'product-comparison':
      return <ProductComparison data={content.data as Parameters<typeof ProductComparison>[0]['data']} />;
    case 'booking-form':
      return <BookingForm />;
    case 'contact-form':
      return <ContactForm />;
    case 'profile-card':
      return <ProfileCard />;
    default:
      return null;
  }
}
