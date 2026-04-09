'use client';

import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/vinfast-data';
import { useChatStore } from '@/store/chat-store';
import { processUserMessage } from '@/components/chat/chat-panel';
import { Battery, Gauge, Users, Zap, ChevronRight, Check } from 'lucide-react';
import type { CarModel } from '@/lib/vinfast-data';

interface CarCardProps {
  carData: CarModel;
}

export function CarCard({ carData }: CarCardProps) {
  const { setSelectedCar, setPhase, addMessage, setTyping } = useChatStore();

  // Defensive: normalise data — AI backend may return different field names
  const name: string = carData.fullName ?? carData.name ?? (carData as any).model ?? 'VinFast';
  const shortName: string = carData.name ?? name;
  const range: number = carData.range ?? (carData as any).range_km ?? 0;
  const seats: number = carData.seats ?? 0;
  const battery: number = carData.batteryCapacity ?? (carData as any).battery_kwh ?? 0;
  const motor: number = carData.motorPower ?? (carData as any).motor_power_kw ?? 0;
  const price: number = carData.priceOnRoad ?? (carData as any).retail_price_vnd ?? 0;
  const accentColor: string = carData.color ?? '#004cc3';
  const available: boolean = carData.showroomAvailable ?? true;
  const category: string = carData.category ?? 'city';
  const bestFor: string[] = Array.isArray(carData.bestFor) ? carData.bestFor : [];

  const handleSelect = () => {
    setSelectedCar(carData);
    addMessage({
      sender: 'user',
      content: `Em quan tâm đến ${name}. Tính giúp em chi phí nhé.`,
    });

    // Process through mock engine with enriched context
    const enrichedMsg = `Em quan tâm đến ${name}. Tính giúp em chi phí nhé. Lương 25 triệu, ngân sách góp tối đa 12 triệu. Trả trước khoảng 300 triệu. 1500km/tháng.`;
    processUserMessage(enrichedMsg);
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl overflow-hidden',
        'bg-surface-container-lowest',
        'ambient-shadow-sm',
        'transition-all duration-300',
        'hover:ambient-shadow'
      )}
    >
      {/* Car Header - Color Bar */}
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}
      />

      <div className="p-5">
        {/* Name & Badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className={cn(
                'text-lg font-bold text-on-surface',
                'font-[family-name:var(--font-plus-jakarta)]'
              )}
            >
              {name}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {category === 'city' ? 'Thành phố' : category === 'compact-suv' ? 'SUV gọn' : 'SUV'}
              {' · '}
              {seats > 0 ? `${seats} chỗ · ` : ''}{range > 0 ? `${range}km tầm vãng` : ''}
            </p>
          </div>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium',
              'bg-primary/10 text-primary',
              'font-[family-name:var(--font-inter)]'
            )}
          >
            {available ? 'Có sẵn' : 'Đặt trước'}
          </div>
        </div>

        {/* Key Specs Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <SpecItem icon={<Gauge className="w-3.5 h-3.5" />} label="Tầm vãng" value={range > 0 ? `${range}km` : 'N/A'} />
          <SpecItem icon={<Users className="w-3.5 h-3.5" />} label="Chỗ ngồi" value={seats > 0 ? `${seats}` : 'N/A'} />
          <SpecItem icon={<Battery className="w-3.5 h-3.5" />} label="Pin" value={battery > 0 ? `${battery}kWh` : 'N/A'} />
          <SpecItem icon={<Zap className="w-3.5 h-3.5" />} label="Mô-tơ" value={motor > 0 ? `${motor}HP` : 'N/A'} />
        </div>

        {/* Divider (surface shift, not line) */}
        <div className="h-2 rounded-full bg-surface-container my-4" />

        {/* Price */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-0.5">
              Giá lăn bánh
            </p>
            <p
              className={cn(
                'text-xl font-bold text-on-surface',
                'font-[family-name:var(--font-plus-jakarta)]'
              )}
            >
              {price > 0 ? formatVND(price) : 'Liên hệ'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant">Chi phí điện</p>
            <p className="text-sm font-semibold text-primary">
              ~500đ/km
            </p>
          </div>
        </div>

        {/* Best For */}
        {bestFor.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {bestFor.slice(0, 3).map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-surface-container text-on-surface-variant"
              >
                <Check className="w-2.5 h-2.5 text-success" />
                {item}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSelect}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
            'bg-primary text-primary-foreground text-sm font-medium',
            'btn-primary-glow',
            'transition-all duration-200',
            'hover:opacity-90 active:scale-[0.98]',
            'font-[family-name:var(--font-inter)]'
          )}
        >
          Tính chi phí cho {shortName}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
        {icon}
      </div>
      <p className="text-[10px] text-on-surface-variant">{label}</p>
      <p className="text-xs font-semibold text-on-surface">{value}</p>
    </div>
  );
}
