'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerBannerProps {
  message?: string;
  variant?: 'warning' | 'info';
}

export function DisclaimerBanner({ 
  message = '⚠️ Bảng tính mang tính chất tham khảo. Tư vấn viên sẽ chốt con số cuối cùng.',
  variant = 'warning'
}: DisclaimerBannerProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl p-3 flex items-start gap-2',
        variant === 'warning'
          ? 'bg-warning/10 border border-warning/20'
          : 'bg-primary/10 border border-primary/20'
      )}
    >
      <AlertTriangle className={cn(
        'w-4 h-4 shrink-0 mt-0.5',
        variant === 'warning' ? 'text-warning' : 'text-primary'
      )} />
      <p className={cn(
        'text-xs leading-relaxed',
        variant === 'warning' ? 'text-warning' : 'text-primary'
      )}>
        {message}
      </p>
    </div>
  );
}
