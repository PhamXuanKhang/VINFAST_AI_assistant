'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

export function ContactForm() {
  const { updateProfile, addMessage, setPhase, setTyping, userProfile } = useChatStore();
  const [name, setName] = useState(userProfile.name || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Họ tên quá ngắn';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3-9]\d{8,9})$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    const cleanPhone = phone.replace(/\s/g, '');

    // Update profile
    updateProfile({ name: name.trim(), phone: cleanPhone });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add user message
    addMessage({
      sender: 'user',
      content: `Họ tên: ${name.trim()}\nSố điện thoại: ${cleanPhone}`,
    });

    setIsSubmitting(false);
    setTyping(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1200));

    addMessage({
      sender: 'ai',
      content: `Cảm ơn anh ${name.trim()}! Em đã ghi nhận thông tin liên hệ.

Anh ${name.trim()} muốn đặt lịch lái thử luôn để trải nghiệm xe thực tế không ạ?`,
      richContent: [{ type: 'booking-form' }],
    });

    setPhase('booking');
    setTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl overflow-hidden',
        'bg-surface-container-lowest',
        'ambient-shadow-sm',
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h4
              className={cn(
                'text-base font-bold text-on-surface',
                'font-[family-name:var(--font-plus-jakarta)]',
              )}
            >
              Thông tin liên hệ
            </h4>
            <p className="text-[11px] text-on-surface-variant">
              Để nhân viên showroom hỗ trợ tốt nhất
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 pb-5 space-y-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
            <User className="w-3.5 h-3.5" />
            Họ và tên
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập họ và tên đầy đủ"
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm text-on-surface',
              'bg-surface-container-low placeholder:text-on-surface-variant/50',
              'outline-none transition-all duration-200',
              'font-[family-name:var(--font-inter)]',
              errors.name
                ? 'ring-2 ring-error/30 bg-error/[0.03]'
                : 'focus:bg-surface-container-lowest focus:ambient-shadow-sm',
            )}
          />
          {errors.name && (
            <p className="text-[11px] text-error pl-1">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
            <Phone className="w-3.5 h-3.5" />
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s]/g, '');
              if (val.length <= 12) setPhone(val);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            onKeyDown={handleKeyDown}
            placeholder="0912 345 678"
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm text-on-surface',
              'bg-surface-container-low placeholder:text-on-surface-variant/50',
              'outline-none transition-all duration-200',
              'font-[family-name:var(--font-inter)]',
              errors.phone
                ? 'ring-2 ring-error/30 bg-error/[0.03]'
                : 'focus:bg-surface-container-lowest focus:ambient-shadow-sm',
            )}
          />
          {errors.phone && (
            <p className="text-[11px] text-error pl-1">{errors.phone}</p>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-[10px] text-on-surface-variant leading-relaxed px-1">
          Thông tin chỉ dùng để nhân viên showroom liên hệ hỗ trợ anh/chị, không lưu trữ hay chia sẻ bên thứ ba.
        </p>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-semibold',
            'bg-primary text-primary-foreground btn-primary-glow',
            'transition-all hover:opacity-90 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2',
            'font-[family-name:var(--font-inter)]',
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang lưu...
            </span>
          ) : (
            <>
              Tiếp tục đặt lịch
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Success indicator when pre-filled */}
        {userProfile.name && userProfile.phone && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/[0.06]">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            <p className="text-[11px] text-success">
              Đã có thông tin từ cuộc trò chuyện trước
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
