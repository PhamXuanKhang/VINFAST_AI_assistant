'use client';

import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { formatVND } from '@/lib/vinfast-data';
import { User, Phone, Car, Wallet, CheckCircle2 } from 'lucide-react';

export function ProfileCard() {
  const { userProfile, selectedCar, financeResult, phase } = useChatStore();

  return (
    <div
      className={cn(
        'w-full rounded-2xl overflow-hidden',
        'bg-surface-container-lowest',
        'ambient-shadow-sm'
      )}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-primary/[0.03]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4
              className={cn(
                'text-sm font-bold text-on-surface',
                'font-[family-name:var(--font-plus-jakarta)]'
              )}
            >
              Hồ sơ khách hàng
            </h4>
            <p className="text-[10px] text-on-surface-variant">
              Thông tin được AI thu thập trong cuộc trò chuyện
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-5 py-4 space-y-3">
        {/* Name & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <ProfileField
            icon={<User className="w-3.5 h-3.5" />}
            label="Họ tên"
            value={userProfile.name || 'Chưa cung cấp'}
            filled={!!userProfile.name}
          />
          <ProfileField
            icon={<Phone className="w-3.5 h-3.5" />}
            label="SĐT"
            value={userProfile.phone || 'Chưa cung cấp'}
            filled={!!userProfile.phone}
          />
        </div>

        {/* Divider */}
        <div className="h-2 rounded-full bg-surface-container" />

        {/* Needs */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
            Nhu cầu
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant">Số người</p>
              <p className="text-sm font-semibold text-on-surface">
                {userProfile.passengers} người
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant">Hành trình</p>
              <p className="text-sm font-semibold text-on-surface">
                {userProfile.monthlyKm.toLocaleString()}km/tháng
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant">Thu nhập</p>
              <p className="text-sm font-semibold text-on-surface">
                {userProfile.monthlyIncome
                  ? formatVND(userProfile.monthlyIncome)
                  : 'Chưa cung cấp'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant">Ngân sách góp</p>
              <p className="text-sm font-semibold text-on-surface">
                {userProfile.monthlyBudget
                  ? formatVND(userProfile.monthlyBudget)
                  : 'Chưa cung cấp'}
              </p>
            </div>
          </div>
        </div>

        {/* Selected Car */}
        {selectedCar && (
          <>
            <div className="h-2 rounded-full bg-surface-container" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {selectedCar.fullName}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {formatVND(selectedCar.priceOnRoad)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Finance Summary */}
        {financeResult && (
          <>
            <div className="h-2 rounded-full bg-surface-container" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0d9f6e]/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#0d9f6e]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Tổng chi phí: {formatVND(financeResult.totalMonthlyCost)}/tháng
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {financeResult.paymentType === 'loan'
                    ? `Góp ${formatVND(financeResult.monthlyPayment)} + Pin ${formatVND(financeResult.monthlyBatteryRental)} + Điện ${formatVND(financeResult.monthlyElectricity)}`
                    : `Pin ${formatVND(financeResult.monthlyBatteryRental)} + Điện ${formatVND(financeResult.monthlyElectricity)}`}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 pt-1">
          <CheckCircle2
            className={cn(
              'w-4 h-4',
              phase === 'completed' ? 'text-success' : 'text-on-surface-variant'
            )}
          />
          <p className="text-[11px] text-on-surface-variant">
            {phase === 'completed'
              ? 'Đã chuyển cho nhân viên tư vấn'
              : 'Đang tư vấn...'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
  filled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  filled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-on-surface-variant">{icon}</div>
      <div>
        <p className="text-[10px] text-on-surface-variant">{label}</p>
        <p
          className={cn(
            'text-sm',
            filled
              ? 'font-medium text-on-surface'
              : 'text-on-surface-variant italic'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
