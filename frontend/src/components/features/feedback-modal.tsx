'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, X, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  messageId: string;
  onSubmit?: (messageId: string, feedback: 'like' | 'dislike', reason?: string) => void;
  onClose?: () => void;
}

export function FeedbackModal({ messageId, onSubmit, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const reasonOptions = [
    { label: 'Sai thông tin', value: 'wrong_info' },
    { label: 'Không liên quan', value: 'irrelevant' },
    { label: 'Trả lời chung chung', value: 'vague' },
    { label: 'Khác', value: 'other' },
  ];

  const handleSubmit = () => {
    if (!feedback) return;
    const finalReason = reason === 'other' ? customReason : reason;
    onSubmit?.(messageId, feedback, finalReason || undefined);
    onClose?.();
  };

  return (
    <div className="mt-2 animate-fade-in-up">
      {/* Feedback buttons */}
      {!feedback && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedback('like')}
            className="p-1.5 rounded-lg hover:bg-success/10 transition-colors cursor-pointer"
            title="Hữu ích"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-on-surface-variant hover:text-success" />
          </button>
          <button
            onClick={() => setFeedback('dislike')}
            className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors cursor-pointer"
            title="Chưa hài lòng"
          >
            <ThumbsDown className="w-3.5 h-3.5 text-on-surface-variant hover:text-warning" />
          </button>
        </div>
      )}

      {/* Dislike reason modal */}
      {feedback === 'dislike' && (
        <div className="w-full rounded-xl bg-surface-container-lowest border border-surface-border p-4 ambient-shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-on-surface">
              Bạn chưa hài lòng vì điều gì?
            </h5>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-container transition-colors"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {reasonOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setReason(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  reason === opt.value
                    ? 'bg-warning/10 text-warning font-medium'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {reason === 'other' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Mô tả cụ thể..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}

          <button
            onClick={handleSubmit}
            className="w-full mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Gửi phản hồi
          </button>
        </div>
      )}

      {/* Like confirmation */}
      {feedback === 'like' && (
        <div className="flex items-center gap-1.5 text-xs text-success animate-fade-in-up">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Cảm ơn bạn đã đánh giá tích cực!</span>
        </div>
      )}
    </div>
  );
}
