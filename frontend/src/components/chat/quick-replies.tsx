'use client';

import { useChatStore } from '@/store/chat-store';
import { cn } from '@/lib/utils';
import { processUserMessage } from './chat-panel';

interface QuickReply { label: string; value: string }

const quickRepliesByPhase: Record<string, QuickReply[]> = {
  idle: [
    { label: 'Tìm xe cho gia đình', value: 'Em muốn tìm xe điện cho gia đình 4 người, đi làm hàng ngày' },
    { label: 'So sánh VF5 vs VF6', value: 'Cho em so sánh chi tiết VF5 Plus và VF6 Plus' },
    { label: 'Xem chi tiết VF5', value: 'Em muốn xem chi tiết thông số VF5 Plus' },
  ],
  interviewing: [
    { label: 'Đi làm 50-60km/ngày', value: 'Em đi làm khoảng 50-60km/ngày, cuối tuần chở gia đình đi Ba Vị' },
    { label: 'Ngân sách ~12tr/tháng', value: 'Ngân sách góp tối đa 12 triệu mỗi tháng' },
    { label: 'Thu nhập 25tr/tháng', value: 'Thu nhập hàng tháng khoảng 25 triệu' },
  ],
  recommendation: [
    { label: 'Xem chi tiết VF5', value: 'Em muốn xem chi tiết thông số VF5 Plus' },
    { label: 'Xem chi tiết VF6', value: 'Em muốn xem chi tiết thông số VF6 Plus' },
    { label: 'So sánh VF5 vs VF6', value: 'Cho em so sánh chi tiết VF5 Plus và VF6 Plus' },
    { label: 'Tính chi phí trả góp', value: 'Tính giúp em chi phí trả góp cho VF5 Plus' },
  ],
  detail: [
    { label: 'So sánh VF5 vs VF6', value: 'Cho em so sánh chi tiết VF5 Plus và VF6 Plus' },
    { label: 'Tính chi phí trả góp', value: 'Tính giúp em chi phí trả góp' },
  ],
  financial: [
    { label: 'So sánh VF5 vs VF6', value: 'Cho em so sánh VF5 Plus và VF6 Plus' },
    { label: 'Xem chi tiết VF6', value: 'Em muốn xem chi tiết thông số VF6 Plus' },
    { label: 'Đặt lịch lái thử', value: 'Em muốn đặt lịch lái thử' },
  ],
  contact_info: [],
  booking: [
    { label: 'Chuyển nhân viên sale', value: 'Chuyển nhân viên sale cho em' },
  ],
  handoff: [],
  completed: [
    { label: 'Cuộc trò chuyện mới', value: 'Xin chào' },
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
