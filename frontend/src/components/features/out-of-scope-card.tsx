'use client';

import { cn } from '@/lib/utils';
import { Shield, MessageSquare, Car } from 'lucide-react';

interface OutOfScopeCardProps {
  onRedirect?: (action: 'find_car' | 'calculate_finance') => void;
}

export function OutOfScopeCard({ onRedirect }: OutOfScopeCardProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-container-lowest ambient-shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h4 className="text-base font-bold text-on-surface mb-1 font-[family-name:var(--font-plus-jakarta)]">
            Ngoài phạm vi tư vấn
          </h4>
          <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
            Mình chỉ có thể tư vấn về xe điện VinFast. Bạn có muốn mình hỗ trợ tìm hiểu mẫu xe hoặc tính toán tài chính không?
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onRedirect?.('find_car')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all cursor-pointer',
            'border-primary bg-transparent text-primary',
            'hover:bg-primary hover:text-white'
          )}
        >
          <Car className="w-4 h-4" />
          <span className="text-sm font-medium">Tìm hiểu xe VinFast</span>
        </button>
        <button
          onClick={() => onRedirect?.('calculate_finance')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all cursor-pointer',
            'border-primary bg-transparent text-primary',
            'hover:bg-primary hover:text-white'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Tính toán tài chính</span>
        </button>
      </div>
    </div>
  );
}
