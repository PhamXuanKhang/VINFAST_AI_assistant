'use client';

import { cn } from '@/lib/utils';

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex gap-2.5 items-end">
        <div
          className={cn(
            'w-8 h-8 rounded-full shrink-0 flex items-center justify-center',
            'bg-primary text-primary-foreground',
            'text-xs font-semibold',
            'font-[family-name:var(--font-plus-jakarta)]'
          )}
        >
          VF
        </div>
        <div
          className={cn(
            'px-5 py-3.5 bg-surface-container-high bubble-ai',
            'flex items-center gap-1.5'
          )}
        >
          <span className="typing-dot w-2 h-2 rounded-full bg-on-surface-variant" />
          <span className="typing-dot w-2 h-2 rounded-full bg-on-surface-variant" />
          <span className="typing-dot w-2 h-2 rounded-full bg-on-surface-variant" />
        </div>
      </div>
    </div>
  );
}
