'use client';

import { useChatStore } from '@/store/chat-store';
import { cn } from '@/lib/utils';
import { processUserMessage } from './chat-panel';

interface QuickReply { label: string; value: string }

const quickRepliesByPhase: Record<string, QuickReply[]> = {
  idle: [
    { label: 'Tìm xe cho gia đình', value: 'Em muốn tìm xe điện cho gia đình 4 người, đi làm hàng ngày' },
    { label: 'So sánh các dòng xe', value: 'Cho em so sánh các dòng xe VinFast' },
    { label: 'Tính trả góp xe điện', value: 'Tính giúp em chi phí trả góp xe điện' },
  ],
  greeting: [
    { label: 'Tìm hiểu về xe VinFast', value: 'Tôi muốn tìm hiểu về xe VinFast' },
    { label: 'Tính trả góp xe điện', value: 'Tính trả góp xe điện' },
    { label: 'So sánh các dòng xe', value: 'So sánh các dòng xe' },
  ],
  car_discovery: [
    { label: 'Tìm xe gia đình 5-7 chỗ', value: 'Tôi cần xe 5-7 chỗ cho gia đình' },
    { label: 'Xe đi làm hàng ngày', value: 'Xe đi làm hàng ngày, ngân sách 500-800 triệu' },
    { label: 'So sánh VF5 vs VF6', value: 'So sánh VF5 và VF6' },
  ],
  clarify: [
    { label: 'Xe 5 chỗ', value: 'Xe 5 chỗ' },
    { label: 'Xe 7 chỗ', value: 'Xe 7 chỗ' },
    { label: 'Ngân sách dưới 600 triệu', value: 'Ngân sách dưới 600 triệu' },
  ],
  finance_question: [],
  finance_full_pay: [
    { label: 'Liên hệ đặt cọc', value: 'Tôi muốn liên hệ để đặt cọc' },
  ],
  finance_installment: [
    { label: 'Dùng lãi suất VinFast 8%', value: 'Dùng lãi suất VinFast 8%/năm' },
    { label: 'Trả trước 30%', value: 'Tôi muốn trả trước 30%' },
    { label: 'Vay 60 tháng', value: 'Vay trong 60 tháng' },
  ],
  contact_info: [],
  booking: [
    { label: 'Chuyển tư vấn viên', value: 'Chuyển tư vấn viên cho em' },
  ],
  handoff: [],
  completed: [
    { label: 'Cuộc trò chuyện mới', value: 'Xin chào' },
  ],
  out_of_scope: [
    { label: 'Tìm hiểu xe VinFast', value: 'Tôi muốn tìm hiểu về xe VinFast' },
    { label: 'Tính toán tài chính', value: 'Tính toán tài chính' },
  ],
};

export function QuickReplies() {
  const { phase, isTyping } = useChatStore();
  const replies = quickRepliesByPhase[phase];
  if (!replies || replies.length === 0 || isTyping) return null;
  return (
    <div className="px-4 py-2 flex gap-2 flex-wrap">
      {replies.map((reply, idx) => <QuickReplyButton key={idx} reply={reply} />)}
    </div>
  );
}

function QuickReplyButton({ reply }: { reply: QuickReply }) {
  const { isTyping } = useChatStore();
  const handleClick = () => { if (!isTyping) processUserMessage(reply.value); };
  return (
    <button onClick={handleClick} className={cn(
      'px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap',
      'bg-surface-container-low text-on-surface',
      'hover:bg-surface-container transition-colors duration-200',
      'font-[family-name:var(--font-inter)]',
      'border border-outline-variant/15',
      'active:scale-[0.97]',
    )}>
      {reply.label}
    </button>
  );
}
