'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SlotFillFormProps {
  slots: {
    down_payment: { value: string | number | null; status: 'filled' | 'pending'; label: string };
    loan_term_months: { value: string | number | null; status: 'filled' | 'pending'; label: string };
    interest_rate: { value: string | number | null; status: 'filled' | 'pending'; label: string };
  };
  question?: string;
}

export function SlotFillForm({ slots, question }: SlotFillFormProps) {
  const slotEntries = Object.entries(slots) as [string, { value: string | number | null; status: 'filled' | 'pending'; label: string }][];

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-container-lowest ambient-shadow-sm p-5">
      <h4 className="text-base font-bold text-on-surface mb-1 font-[family-name:var(--font-plus-jakarta)]">
        📋 Thông tin vay trả góp
      </h4>
      {question && (
        <p className="text-sm text-on-surface mb-3 font-[family-name:var(--font-inter)]">
          {question}
        </p>
      )}

      <div className="space-y-2.5">
        {slotEntries.map(([key, slot]) => (
          <div
            key={key}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border transition-colors',
              slot.status === 'filled'
                ? 'border-success/30 bg-success/[0.03]'
                : 'border-warning/30 bg-warning/[0.03]'
            )}
          >
            <div className="flex items-center gap-2.5">
              {slot.status === 'filled' ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertCircle className="w-4 h-4 text-warning" />
              )}
              <span className="text-sm text-on-surface font-[family-name:var(--font-inter)]">
                {slot.label}
              </span>
            </div>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                slot.status === 'filled' ? 'text-success' : 'text-warning'
              )}
            >
              {slot.value !== null ? (
                typeof slot.value === 'number' ? (
                  key === 'loan_term_months' ? (
                    `${slot.value} tháng`
                  ) : key === 'interest_rate' ? (
                    `${slot.value}%/năm`
                  ) : (
                    slot.value.toLocaleString('vi-VN') + '₫'
                  )
                ) : (
                  slot.value
                )
              ) : (
                'Chưa có'
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-surface-container-low">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Vui lòng cung cấp đầy đủ thông tin để tính toán chi phí chính xác.
        </p>
      </div>
    </div>
  );
}
