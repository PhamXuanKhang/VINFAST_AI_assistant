'use client';

import { cn } from '@/lib/utils';
import type { CarModel } from '@/lib/vinfast-data';
import { Gauge, Users, Zap, Battery, Check, X } from 'lucide-react';

interface ProductComparisonProps {
  data: { car1: CarModel; car2: CarModel };
}

export function ProductComparison({ data }: ProductComparisonProps) {
  const { car1, car2 } = data;

  const specs: { label: string; key: string; icon: React.ReactNode; format?: (v: unknown) => string }[] = [
    { label: 'Mô-tơ', key: 'motorPower', icon: <Zap className="w-3.5 h-3.5" />, format: (v) => `${v} HP` },
    { label: 'Mô-men xoắn', key: 'motorTorque', icon: <Zap className="w-3.5 h-3.5" />, format: (v) => `${v} Nm` },
    { label: 'Tốc độ tối đa', key: 'topSpeed', icon: <Gauge className="w-3.5 h-3.5" />, format: (v) => `${v} km/h` },
    { label: '0-100 km/h', key: 'acceleration', icon: <Gauge className="w-3.5 h-3.5" /> },
    { label: 'Pin', key: 'batteryCapacity', icon: <Battery className="w-3.5 h-3.5" />, format: (v) => `${v} kWh` },
    { label: 'Tầm vãng', key: 'range', icon: <Gauge className="w-3.5 h-3.5" />, format: (v) => `${v} km` },
    { label: 'Chỗ ngồi', key: 'seats', icon: <Users className="w-3.5 h-3.5" /> },
    { label: 'Sạc nhanh', key: 'fastChargeTime', icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Cốp xe', key: 'trunkCapacity', icon: <Users className="w-3.5 h-3.5" />, format: (v) => `${v} L` },
    { label: 'Trọng lượng', key: 'weight', icon: <Gauge className="w-3.5 h-3.5" />, format: (v) => `${v} kg` },
    { label: 'Sạc DC', key: 'chargingPowerDC', icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Bảo hành xe', key: 'vehicleWarrantyYears', icon: <Battery className="w-3.5 h-3.5" />, format: (v) => `${v} năm` },
    { label: 'Bảo hành pin', key: 'batteryWarrantyYears', icon: <Battery className="w-3.5 h-3.5" />, format: (v) => `${v} năm` },
    { label: 'Túi khí', key: 'features', icon: <Users className="w-3.5 h-3.5" />, format: (v: unknown) => {
      const features = (v as string[]).find(f => /túi khí/i.test(f));
      return features || '-';
    }},
  ];

  const getVal = (car: CarModel, key: string): string | number | string[] => {
    return (car as Record<string, unknown>)[key] as string | number | string[];
  };

  const getWinner = (key: string): 'car1' | 'car2' | 'tie' => {
    const v1 = getVal(car1, key);
    const v2 = getVal(car2, key);
    if (typeof v1 !== 'number' || typeof v2 !== 'number') return 'tie';
    if (key === 'weight') return v1 < v2 ? 'car1' : v2 < v1 ? 'car2' : 'tie';
    return v1 > v2 ? 'car1' : v2 > v1 ? 'car2' : 'tie';
  };

  return (
    <div className={cn(
      'w-full rounded-2xl overflow-hidden',
      'bg-surface-container-lowest',
      'ambient-shadow-sm',
    )}>
      <div className="px-5 pt-5 pb-3">
        <h4 className={cn(
          'text-base font-bold text-on-surface mb-1',
          'font-[family-name:var(--font-plus-jakarta)]',
        )}>
          📊 So sánh sản phẩm
        </h4>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center px-4">
        <div className="text-right pr-4">
          <p className={cn('text-sm font-bold text-on-surface', 'font-[family-name:var(--font-plus-jakarta)]')}>
            {car1.fullName}
          </p>
          <p className="text-[10px] text-on-surface-variant">{car1.category === 'city' ? 'Thành phố' : 'SUV'}</p>
        </div>
        <div className="w-px h-8 bg-surface-container mx-3" />
        <div className="text-left pl-4">
          <p className={cn('text-sm font-bold text-on-surface', 'font-[family-name:var(--font-plus-jakarta)]')}>
            {car2.fullName}
          </p>
          <p className="text-[10px] text-on-surface-variant">{car2.category === 'city' ? 'Thành phố' : 'SUV'}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 rounded-full bg-surface-container mx-5 my-3" />

      {/* Specs Rows */}
      <div className="px-4 pb-5 space-y-1">
        {specs.map((spec) => {
          const winner = getWinner(spec.key);
          return (
            <div key={spec.key} className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center py-2 rounded-lg hover:bg-surface-container-low/50 transition-colors">
              <div className={cn(
                'text-right pr-4 text-xs',
                winner === 'car1' ? 'font-bold text-primary' : 'text-on-surface-variant',
              )}>
                {spec.format ? spec.format(getVal(car1, spec.key)) : String(getVal(car1, spec.key))}
                {winner === 'car1' && <span className="ml-1 inline-block"><Check className="w-3 h-3 text-primary inline" /></span>}
              </div>
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-on-surface-variant">{spec.icon}</span>
                <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{spec.label}</span>
              </div>
              <div className={cn(
                'text-left pl-4 text-xs',
                winner === 'car2' ? 'font-bold text-primary' : 'text-on-surface-variant',
              )}>
                {winner === 'car2' && <span className="mr-1 inline-block"><Check className="w-3 h-3 text-primary inline" /></span>}
                {spec.format ? spec.format(getVal(car2, spec.key)) : String(getVal(car2, spec.key))}
              </div>
            </div>
          );
        })}

        {/* Feature count comparison */}
        <div className="h-2 rounded-full bg-surface-container my-2" />
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 items-center py-2">
          <div className="text-right pr-4">
            <span className="text-sm font-bold text-primary">{car1.features.length}</span>
            <span className="text-[10px] text-on-surface-variant ml-1">trang bị</span>
          </div>
          <div className="px-2">
            <span className="text-[10px] text-on-surface-variant">Trang bị</span>
          </div>
          <div className="text-left pl-4">
            <span className="text-sm font-bold text-primary">{car2.features.length}</span>
            <span className="text-[10px] text-on-surface-variant ml-1">trang bị</span>
          </div>
        </div>
      </div>
    </div>
  );
}
