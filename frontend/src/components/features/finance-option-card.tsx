'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Wallet, Calendar } from 'lucide-react';

interface FinanceOptionCardProps {
  onSelect?: (type: 'full_pay' | 'installment') => void;
}

export function FinanceOptionCard({ onSelect }: FinanceOptionCardProps) {
  const [selected, setSelected] = useState<'full_pay' | 'installment' | null>(null);

  const handleSelect = (type: 'full_pay' | 'installment') => {
    setSelected(type);
    onSelect?.(type);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-container-lowest ambient-shadow-sm p-5">
      <h4 className="text-base font-bold text-on-surface mb-1 font-[family-name:var(--font-plus-jakarta)]">
        💳 Phương thức thanh toán
      </h4>
      <p className="text-xs text-on-surface-variant mb-4">
        Chọn hình thức mua xe phù hợp với bạn
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSelect('full_pay')}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
            'hover:border-primary hover:bg-primary/[0.03]',
            selected === 'full_pay'
              ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20'
              : 'border-surface-border bg-surface-container-low'
          )}
        >
          <Wallet className={cn(
            'w-6 h-6',
            selected === 'full_pay' ? 'text-primary' : 'text-on-surface-variant'
          )} />
          <span className={cn(
            'text-sm font-semibold',
            selected === 'full_pay' ? 'text-primary' : 'text-on-surface'
          )}>
            Mua thẳng
          </span>
          <span className="text-[10px] text-on-surface-variant text-center">
            Thanh toán 100%
          </span>
        </button>

        <button
          onClick={() => handleSelect('installment')}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
            'hover:border-primary hover:bg-primary/[0.03]',
            selected === 'installment'
              ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/20'
              : 'border-surface-border bg-surface-container-low'
          )}
        >
          <Calendar className={cn(
            'w-6 h-6',
            selected === 'installment' ? 'text-primary' : 'text-on-surface-variant'
          )} />
          <span className={cn(
            'text-sm font-semibold',
            selected === 'installment' ? 'text-primary' : 'text-on-surface'
          )}>
            Trả góp
          </span>
          <span className="text-[10px] text-on-surface-variant text-center">
            Vay ngân hàng
          </span>
        </button>
      </div>
    </div>
  );
}
