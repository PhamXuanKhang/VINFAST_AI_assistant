'use client';

import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/vinfast-data';
import { Wallet, Zap, CheckCircle2, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';

interface FinanceTableData {
  carName: string;
  paymentType: 'full' | 'loan';
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  monthlyElectricity: number;
  monthlyInsurance: number;
  totalMonthlyCost: number;
  interestRate: number;
  loanTerm: number;
  bankName: string;
  totalLoanCost: number;
  totalInterest: number;
  electricityPerKm: number;
  affordability: 'affordable' | 'tight' | 'overbudget';
  affordabilityRatio: number;
}

interface FinanceTableProps { data: FinanceTableData; }

export function FinanceTable({ data }: FinanceTableProps) {
  const [showDetails, setShowDetails] = useState(false);

  const affConfig = {
    affordable: { color: 'text-success', bg: 'bg-success/10', label: 'Phù hợp', icon: <CheckCircle2 className="w-4 h-4" /> },
    tight: { color: 'text-warning', bg: 'bg-warning/10', label: 'Cần cân nhắc', icon: <AlertTriangle className="w-4 h-4" /> },
    overbudget: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Vượt ngân sách', icon: <AlertTriangle className="w-4 h-4" /> },
  };
  const aff = affConfig[data.affordability];

  return (
    <div className={cn('w-full rounded-2xl overflow-hidden', 'bg-surface-container-lowest', 'ambient-shadow-sm')}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn('text-base font-bold text-on-surface', 'font-[family-name:var(--font-plus-jakarta)]')}>
            💰 Bảng chi phí {data.carName}
          </h4>
          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium', aff.bg, aff.color)}>
            {aff.icon} {aff.label}
          </span>
        </div>
        {data.paymentType === 'loan' && (
          <p className="text-xs text-on-surface-variant">
            {data.bankName} · Lãi suất {data.interestRate}%/năm · {data.loanTerm} tháng
          </p>
        )}
      </div>

      {/* Hero Number */}
      <div className="px-5 py-4 bg-primary/[0.03]">
        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Tổng chi phí hàng tháng</p>
        <p className={cn('text-3xl font-bold text-primary', 'font-[family-name:var(--font-plus-jakarta)]')}>
          {formatVND(data.totalMonthlyCost)}
          <span className="text-sm font-normal text-on-surface-variant">/tháng</span>
        </p>
        {data.paymentType === 'loan' && (
          <div className="mt-3 flex rounded-full overflow-hidden h-2 bg-surface-container">
            <div className="bg-primary h-full" style={{ width: `${(data.monthlyPayment / data.totalMonthlyCost) * 100}%` }} title={`Góp xe: ${formatVND(data.monthlyPayment)}`} />
            <div className="bg-[#e8a317] h-full" style={{ width: `${(data.monthlyElectricity / data.totalMonthlyCost) * 100}%` }} title={`Điện: ${formatVND(data.monthlyElectricity)}`} />
            <div className="bg-[#0d9f6e] h-full" style={{ width: `${(data.monthlyInsurance / data.totalMonthlyCost) * 100}%` }} title={`Bảo hiểm: ${formatVND(data.monthlyInsurance)}`} />
          </div>
        )}
      </div>

      {/* Rows */}
      <div className="px-5 py-3 space-y-2.5">
        {data.paymentType === 'loan' && (
          <CostRow icon={<Wallet className="w-4 h-4 text-primary" />} label="Trả góp hàng tháng" value={formatVND(data.monthlyPayment)} highlight />
        )}
        <CostRow icon={<Zap className="w-4 h-4 text-[#e8a317]" />} label="Tiền điện sạc nhà" value={formatVND(data.monthlyElectricity)} subtitle={`${formatVND(data.electricityPerKm)}/km`} />
        <CostRow icon={<Info className="w-4 h-4 text-[#0d9f6e]" />} label="Bảo hiểm xe (~1.5%/năm)" value={formatVND(data.monthlyInsurance)} />
      </div>

      {/* Expandable */}
      <button onClick={() => setShowDetails(!showDetails)} className={cn('w-full px-5 py-2.5 flex items-center justify-center gap-1', 'text-xs text-primary font-medium hover:bg-surface-container-low transition-colors', 'font-[family-name:var(--font-inter)]')}>
        {showDetails ? 'Thu gọn' : 'Chi tiết thêm'}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showDetails && 'rotate-180')} />
      </button>

      {showDetails && (
        <div className="px-5 pb-4 space-y-2 animate-fade-in-up">
          {data.paymentType === 'loan' && (
            <>
              <DetailRow label="Trả trước" value={formatVND(data.downPayment)} />
              <DetailRow label="Số tiền vay" value={formatVND(data.loanAmount)} />
              <DetailRow label="Tổng trả góp" value={formatVND(data.totalLoanCost)} />
              <DetailRow label="Tiền lãi tổng" value={formatVND(data.totalInterest)} warn />
            </>
          )}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container-low mt-2">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Chi phí điện tính theo giá sinh hoạt EVN bậc 3-4. Pin đi kèm xe, không cần thuê riêng. Bảo hành pin lên đến 10 năm.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CostRow({ icon, label, value, highlight, subtitle }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <p className={cn('text-sm', highlight ? 'font-semibold text-on-surface' : 'text-on-surface-variant', 'font-[family-name:var(--font-inter)]')}>{label}</p>
          {subtitle && <p className="text-[10px] text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      <p className={cn('text-sm font-semibold tabular-nums', highlight ? 'text-on-surface' : 'text-on-surface-variant', 'font-[family-name:var(--font-inter)]')}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className={cn('text-xs font-medium tabular-nums', warn ? 'text-warning' : 'text-on-surface')}>{value}</p>
    </div>
  );
}
