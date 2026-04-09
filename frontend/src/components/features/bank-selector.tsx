'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Building2, Check, ChevronDown } from 'lucide-react';

interface BankOption {
  bank_id: string;
  bank_name: string;
  interest_rate: number;
  max_term_months: number;
  max_loan_percentage: number;
  notes?: string;
}

interface BankSelectorProps {
  banks: BankOption[];
  onSelect?: (bank: BankOption) => void;
  onUseDefault?: () => void;
}

export function BankSelector({ banks, onSelect, onUseDefault }: BankSelectorProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (bank: BankOption) => {
    setSelectedBank(bank.bank_id);
    onSelect?.(bank);
  };

  const displayBanks = expanded ? banks : banks.slice(0, 3);

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-container-lowest ambient-shadow-sm p-5">
      <h4 className="text-base font-bold text-on-surface mb-1 font-[family-name:var(--font-plus-jakarta)]">
        🏦 Chọn ngân hàng vay
      </h4>
      <p className="text-xs text-on-surface-variant mb-4">
        So sánh lãi suất và điều kiện từ các ngân hàng đối tác
      </p>

      {/* Default option button */}
      <button
        onClick={onUseDefault}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-xl border-2 mb-3 transition-all',
          'border-primary bg-primary/[0.05] hover:bg-primary/[0.08] cursor-pointer'
        )}
      >
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-semibold text-primary">VinFast Finance (mặc định)</p>
            <p className="text-[10px] text-on-surface-variant">Lãi suất ưu đãi 8%/năm năm đầu</p>
          </div>
        </div>
        <Check className="w-4 h-4 text-primary" />
      </button>

      {/* Bank list */}
      <div className="space-y-2">
        {displayBanks.map((bank) => (
          <button
            key={bank.bank_id}
            onClick={() => handleSelect(bank)}
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer',
              selectedBank === bank.bank_id
                ? 'border-primary bg-primary/[0.05] ring-1 ring-primary/20'
                : 'border-surface-border bg-surface-container-low hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className={cn(
                'w-4 h-4',
                selectedBank === bank.bank_id ? 'text-primary' : 'text-on-surface-variant'
              )} />
              <div className="text-left">
                <p className={cn(
                  'text-sm font-semibold',
                  selectedBank === bank.bank_id ? 'text-primary' : 'text-on-surface'
                )}>
                  {bank.bank_name}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Lãi suất: {bank.interest_rate}%/năm · Tối đa {bank.max_term_months} tháng
                </p>
              </div>
            </div>
            {selectedBank === bank.bank_id && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </div>

      {banks.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          {expanded ? 'Thu gọn' : `Xem thêm ${banks.length - 3} ngân hàng`}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
