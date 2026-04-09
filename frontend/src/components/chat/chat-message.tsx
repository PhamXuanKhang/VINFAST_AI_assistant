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
import { FinanceOptionCard } from '@/components/features/finance-option-card';
import { SlotFillForm } from '@/components/features/slot-fill-form';
import { BankSelector } from '@/components/features/bank-selector';
import { DisclaimerBanner } from '@/components/features/disclaimer-banner';
import { ClarifyPrompt } from '@/components/features/clarify-prompt';
import { OutOfScopeCard } from '@/components/features/out-of-scope-card';
import { HandoffButton } from '@/components/features/handoff-button';
import { FeedbackModal } from '@/components/features/feedback-modal';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
            isUser ? cn('bg-primary text-primary-foreground bubble-user', 'font-[family-name:var(--font-inter)]') : cn('bg-surface-container-high text-on-surface bubble-ai', 'font-[family-name:var(--font-inter)]')
          )}>
            {isAI ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto border border-outline-variant/[0.2] rounded-lg my-3">
                      <table className="w-full text-sm text-left">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="bg-surface-container-low p-2 font-semibold border-b border-outline-variant/[0.2]">{children}</th>,
                  td: ({ children }) => <td className="p-2 border-b border-outline-variant/[0.1]">{children}</td>,
                  code: (props: any) => {
                    const inline = props.inline;
                    const children = props.children;
                    return inline ? (
                      <code className="bg-[#F1F3F5] text-black px-1 py-0.5 rounded text-[13px] font-mono">{children}</code>
                    ) : (
                      <pre className="bg-[#F1F3F5] text-black p-2 rounded-lg text-[13px] overflow-x-auto mt-2 mb-2 font-mono"><code>{children}</code></pre>
                    );
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
          {message.richContent && message.richContent.length > 0 && (
            <div className="mt-2 space-y-3 animate-fade-in-up">
              {message.richContent.map((rich, idx) => <RichContentRenderer key={idx} content={rich} />)}
            </div>
          )}
          {/* Feedback buttons for AI messages */}
          {isAI && <FeedbackWrapper messageId={message.id} />}
          <span className={cn('text-[10px] text-on-surface-variant mt-0.5', isUser ? 'text-right pr-1' : 'pl-1')}>
            {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function FeedbackWrapper({ messageId }: { messageId: string }) {
  return <FeedbackModal messageId={messageId} />;
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
    case 'finance-option-card':
      return <FinanceOptionCard />;
    case 'slot-fill-form':
      return <SlotFillForm slots={content.data as any} />;
    case 'bank-selector':
      return <BankSelector banks={content.data?.banks as any} />;
    case 'disclaimer-banner':
      return <DisclaimerBanner message={content.data?.message as string} variant={content.data?.variant as any} />;
    case 'clarify-prompt':
      return <ClarifyPrompt question={content.data?.question as string} options={content.data?.options as any} />;
    case 'out-of-scope-card':
      return <OutOfScopeCard />;
    case 'handoff-button':
      return <HandoffButton label={content.data?.label as string} />;
    default:
      return null;
  }
}
