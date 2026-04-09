'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { showrooms } from '@/lib/vinfast-data';
import { formatVND } from '@/lib/vinfast-data';
import { useChatStore } from '@/store/chat-store';
import {
  MapPin,
  Clock,
  Phone,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export function BookingForm() {
  const {
    setSelectedShowroom, setSelectedSlot, setPhase, addMessage,
    selectedCar, userProfile, setTyping, setFinanceResult, updateProfile,
  } = useChatStore();
  const [selectedShowroomId, setSelectedShowroomId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'showroom' | 'date' | 'confirm'>('showroom');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedShowroom = showrooms.find((s) => s.id === selectedShowroomId);
  const availableDates = selectedShowroom?.availableSlots.map((s) => s.date) || [];
  const availableSlots = selectedShowroom?.availableSlots.find(
    (s) => s.date === selectedDate
  )?.timeSlots.filter((t) => t.available);

  const handleShowroomSelect = (id: string) => {
    setSelectedShowroomId(id);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleConfirm = async () => {
    if (!selectedShowroom || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setSelectedShowroom(selectedShowroom);
    setSelectedSlot({ date: selectedDate, time: selectedTime });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    addMessage({
      sender: 'user',
      content: `Em muốn đặt lịch lái thử ${selectedCar?.fullName || 'xe VinFast'} tại ${selectedShowroom.name}, ${selectedDate} lúc ${selectedTime}.`,
    });

    setIsSubmitting(false);
    setTyping(true);
    setPhase('completed');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const dateStr = new Date(selectedDate).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });

    addMessage({
      sender: 'ai',
      content: `Đặt lịch thành công! 🎉

Anh/chị đã đặt lịch lái thử${selectedCar ? ` ${selectedCar.fullName}` : ''}:
📍 ${selectedShowroom.name}
📅 ${dateStr}
🕐 ${selectedTime}${userProfile.name ? `\n👤 ${userProfile.name}` : ''}${userProfile.phone ? `\n📱 ${userProfile.phone}` : ''}

Nhân viên tư vấn sẽ gọi điện xác nhận trước giờ hẹn. Anh/chị có cần em hỗ trợ thêm gì không ạ?`,
      richContent: [{ type: 'profile-card' }],
    });

    setTyping(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'w-full rounded-2xl overflow-hidden',
        'bg-surface-container-lowest',
        'ambient-shadow-sm'
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h4
          className={cn(
            'text-base font-bold text-on-surface mb-1',
            'font-[family-name:var(--font-plus-jakarta)]'
          )}
        >
          🗓️ Đặt lịch lái thử
        </h4>
        <p className="text-xs text-on-surface-variant">
          Chọn showroom và khung giờ phù hợp
        </p>
      </div>

      {/* Steps */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2">
          {(['showroom', 'date', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['showroom', 'date', 'confirm'].indexOf(step) > i
                    ? 'bg-success text-white'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {['showroom', 'date', 'confirm'].indexOf(step) > i ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className="flex-1 h-px bg-surface-container" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-on-surface-variant w-1/3 text-center">
            Showroom
          </span>
          <span className="text-[9px] text-on-surface-variant w-1/3 text-center">
            Ngày/Giờ
          </span>
          <span className="text-[9px] text-on-surface-variant w-1/3 text-center">
            Xác nhận
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="px-5 pb-5 min-h-[180px]">
        {step === 'showroom' && (
          <div className="space-y-2 animate-fade-in-up">
            {showrooms.map((sr) => (
              <button
                key={sr.id}
                onClick={() => handleShowroomSelect(sr.id)}
                className={cn(
                  'w-full text-left p-3.5 rounded-xl transition-all duration-200',
                  selectedShowroomId === sr.id
                    ? 'bg-primary/[0.08] ambient-shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {sr.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                      {sr.address}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <Clock className="w-3 h-3" />
                        {sr.openHours}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <Phone className="w-3 h-3" />
                        {sr.phone}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'date' && (
          <div className="space-y-3 animate-fade-in-up">
            <button
              onClick={() => {
                setStep('showroom');
                setSelectedDate(null);
              }}
              className="text-xs text-primary font-medium"
            >
              ← Quay lại
            </button>

            {/* Date Selection */}
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Chọn ngày
            </p>
            <div className="flex gap-2">
              {availableDates.map((date) => (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-xs font-medium transition-all',
                    selectedDate === date
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
                    'font-[family-name:var(--font-inter)]'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5 mx-auto mb-1" />
                  {formatDate(date)}
                </button>
              ))}
            </div>

            {/* Time Selection */}
            {selectedDate && availableSlots && availableSlots.length > 0 && (
              <>
                <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Chọn giờ
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-medium transition-all',
                        selectedTime === slot.time
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container',
                        'font-[family-name:var(--font-inter)]'
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedDate && selectedTime && (
              <button
                onClick={() => setStep('confirm')}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-medium',
                  'bg-primary text-primary-foreground btn-primary-glow',
                  'transition-all hover:opacity-90 active:scale-[0.98]',
                  'font-[family-name:var(--font-inter)]'
                )}
              >
                Tiếp tục
              </button>
            )}
          </div>
        )}

        {step === 'confirm' && selectedShowroom && selectedDate && selectedTime && (
          <div className="animate-fade-in-up">
            <button
              onClick={() => setStep('date')}
              className="text-xs text-primary font-medium mb-3"
            >
              ← Quay lại
            </button>

            {/* Confirmation Card */}
            <div className="p-4 rounded-xl bg-surface-container-low space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedShowroom.name}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {selectedShowroom.address}
                  </p>
                </div>
              </div>

              <div className="h-2 rounded-full bg-surface-container" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-on-surface-variant">Ngày</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {formatDate(selectedDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-on-surface-variant">Giờ</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedTime}
                  </p>
                </div>
              </div>

              {selectedCar && (
                <>
                  <div className="h-2 rounded-full bg-surface-container" />
                  <div>
                    <p className="text-[10px] text-on-surface-variant">
                      Xe lái thử
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {selectedCar.fullName}{' '}
                      <span className="text-xs font-normal text-on-surface-variant">
                        ({formatVND(selectedCar.priceOnRoad)})
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={cn(
                'w-full mt-4 py-3 rounded-xl text-sm font-semibold',
                'bg-primary text-primary-foreground btn-primary-glow',
                'transition-all hover:opacity-90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'font-[family-name:var(--font-inter)]'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đặt lịch...
                </span>
              ) : (
                'Xác nhận đặt lịch'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
