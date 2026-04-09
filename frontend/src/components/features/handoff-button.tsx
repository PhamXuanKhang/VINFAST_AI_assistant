'use client';

import { cn } from '@/lib/utils';
import { Phone, MessageCircle } from 'lucide-react';

interface HandoffButtonProps {
  label?: string;
  onClick?: () => void;
  variant?: 'phone' | 'chat';
}

export function HandoffButton({ 
  label = 'Kết nối tư vấn viên',
  onClick,
  variant = 'phone'
}: HandoffButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all cursor-pointer',
        'bg-success hover:bg-success/90 text-white',
        'ambient-shadow-md hover:shadow-lg'
      )}
    >
      {variant === 'phone' ? (
        <Phone className="w-4 h-4" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
