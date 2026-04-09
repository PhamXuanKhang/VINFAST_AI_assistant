'use client';

import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/vinfast-data';
import type { CarModel } from '@/lib/vinfast-data';
import { useChatStore } from '@/store/chat-store';
import { processUserMessage } from '@/components/chat/chat-panel';
import {
  Gauge, Users, Zap, Battery, Car as CarIcon, Wind, Settings2, Shield,
  Mountain, Timer, Weight, ChevronRight,
} from 'lucide-react';

interface CarDetailProps {
  carData: CarModel;
}

export function CarDetailCard({ carData }: CarDetailProps) {
  const { setSelectedCar, setPhase, addMessage, setTyping } = useChatStore();

  const handleFinance = () => {
    const msg = `Em quan tâm đến ${carData.fullName}. Tính giúp em chi phí nhé. Lương 25 triệu, ngân sách góp tối đa 12 triệu. Trả trước khoảng 300 triệu. 1500km/tháng.`;
    processUserMessage(msg);
  };

  return (
    <div className={cn(
      'w-full rounded-2xl overflow-hidden',
      'bg-surface-container-lowest',
      'ambient-shadow-sm',
    )}>
      {/* Color Bar */}
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${carData.color}, ${carData.color}88)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <h3 className={cn(
            'text-xl font-bold text-on-surface',
            'font-[family-name:var(--font-plus-jakarta)]',
          )}>
            {carData.fullName}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {carData.category === 'city' ? 'Thành phố' : carData.category === 'compact-suv' ? 'SUV gọn' : 'SUV'}
            {' · '}
            {carData.seats} chỗ · {carData.drivetrain}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
          {carData.description}
        </p>

        {/* Specs Grid */}
        <div className="h-2 rounded-full bg-surface-container mb-4" />
        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-3">Thông số kỹ thuật</p>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <SpecItem icon={<Zap className="w-3.5 h-3.5" />} label="Mô-tơ" value={`${carData.motorPower} HP`} />
          <SpecItem icon={<Gauge className="w-3.5 h-3.5" />} label="Tốc độ tối đa" value={`${carData.topSpeed} km/h`} />
          <SpecItem icon={<Timer className="w-3.5 h-3.5" />} label="0-100 km/h" value={carData.acceleration} />
          <SpecItem icon={<Battery className="w-3.5 h-3.5" />} label="Pin" value={`${carData.batteryCapacity} kWh`} />
          <SpecItem icon={<Gauge className="w-3.5 h-3.5" />} label="Tầm vãng" value={`${carData.range} km`} />
          <SpecItem icon={<Users className="w-3.5 h-3.5" />} label="Chỗ ngồi" value={`${carData.seats}`} />
        </div>

        {/* Detailed Specs */}
        <div className="space-y-2 mb-4">
          <DetailRow icon={<CarIcon className="w-3.5 h-3.5" />} label="Kích thước (D x R x C)" value={`${carData.bodyDimensions.length} x ${carData.bodyDimensions.width} x ${carData.bodyDimensions.height} mm`} />
          <DetailRow icon={<Settings2 className="w-3.5 h-3.5" />} label="Chiều dài cơ sở" value={`${carData.wheelbase} mm`} />
          <DetailRow icon={<Mountain className="w-3.5 h-3.5" />} label="Khoảng sáng gầm" value={`${carData.groundClearance} mm`} />
          <DetailRow icon={<Weight className="w-3.5 h-3.5" />} label="Trọng lượng" value={`${carData.weight} kg`} />
          <DetailRow icon={<Wind className="w-3.5 h-3.5" />} label="Dẫn động" value={carData.drivetrain} />
          <DetailRow icon={<Settings2 className="w-3.5 h-3.5" />} label="Treo" value={carData.suspension} />
          <DetailRow icon={<Shield className="w-3.5 h-3.5" />} label="Phanh" value={carData.braking} />
          <DetailRow icon={<Zap className="w-3.5 h-3.5" />} label="Sạc nhanh DC" value={carData.chargingPowerDC} />
          <DetailRow icon={<Timer className="w-3.5 h-3.5" />} label="Thời gian sạc nhanh" value={carData.fastChargeTime} />
          <DetailRow icon={<Timer className="w-3.5 h-3.5" />} label="Sạc đầy ở nhà" value={carData.homeChargeTime} />
          <DetailRow icon={<Settings2 className="w-3.5 h-3.5" />} label="Mâm lăn" value={carData.wheelSize} />
          <DetailRow icon={<CarIcon className="w-3.5 h-3.5" />} label="Cốp xe" value={`${carData.trunkCapacity} L`} />
          <DetailRow icon={<Shield className="w-3.5 h-3.5" />} label="Bảo hành xe" value={`${carData.vehicleWarrantyYears} năm`} />
          <DetailRow icon={<Battery className="w-3.5 h-3.5" />} label="Bảo hành pin" value={`${carData.batteryWarrantyYears} năm`} />
        </div>

        {/* Features */}
        <div className="h-2 rounded-full bg-surface-container mb-4" />
        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2.5">Trang bị nổi bật</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {carData.features.map((f, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] bg-surface-container text-on-surface-variant">
              {f}
            </span>
          ))}
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-success/[0.04]">
            <p className="text-[10px] font-medium text-success uppercase tracking-wider mb-2">Ưu điểm</p>
            {carData.pros.map((p, i) => (
              <p key={i} className="text-[11px] text-on-surface-variant mb-1">✓ {p}</p>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-warning/[0.04]">
            <p className="text-[10px] font-medium text-warning uppercase tracking-wider mb-2">Lưu ý</p>
            {carData.cons.map((c, i) => (
              <p key={i} className="text-[11px] text-on-surface-variant mb-1">• {c}</p>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleFinance}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
            'bg-primary text-primary-foreground text-sm font-medium',
            'btn-primary-glow',
            'transition-all duration-200 hover:opacity-90 active:scale-[0.98]',
            'font-[family-name:var(--font-inter)]',
          )}
        >
          Tính chi phí cho {carData.name}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-container-low">
      <div className="text-on-surface-variant">{icon}</div>
      <p className="text-[10px] text-on-surface-variant text-center">{label}</p>
      <p className="text-xs font-semibold text-on-surface text-center">{value}</p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant">{icon}</span>
        <p className="text-xs text-on-surface-variant">{label}</p>
      </div>
      <p className="text-xs font-medium text-on-surface text-right max-w-[60%]">{value}</p>
    </div>
  );
}
