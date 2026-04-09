'use client';

import { cn } from '@/lib/utils';

interface ClarifyOption {
  label: string;
  value: string;
  icon?: string;
}

interface ClarifyPromptProps {
  question: string;
  options: ClarifyOption[];
  onSelect?: (value: string) => void;
}

export function ClarifyPrompt({ question, options, onSelect }: ClarifyPromptProps) {
  const handleClick = (value: string) => {
    onSelect?.(value);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-container-lowest ambient-shadow-sm p-5">
      <h4 className="text-base font-bold text-on-surface mb-1 font-[family-name:var(--font-plus-jakarta)]">
        🔍 Cần thêm thông tin
      </h4>
      <p className="text-sm text-on-surface mb-4 font-[family-name:var(--font-inter)]">
        {question}
      </p>

      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(option.value)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
              'border-surface-border bg-surface-container-low',
              'hover:border-primary hover:bg-primary/[0.03] hover:shadow-sm'
            )}
          >
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <span className="text-sm text-on-surface font-[family-name:var(--font-inter)]">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
