'use client';

import { useSyncExternalStore } from 'react';
import { useChatStore } from '@/store/chat-store';
import { ChatPanel } from '@/components/chat/chat-panel';
import { cn } from '@/lib/utils';
import {
  X,
  MessageCircle,
  Zap,
  Shield,
  Calculator,
  Calendar,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { isOpen, setIsOpen, phase, resetChat, addMessage, setPhase, setTyping } = useChatStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const handleStartChat = () => {
    setIsOpen(true);
    if (phase === 'idle') {
      // Send welcome message after a brief delay
      setTyping(true);
      setTimeout(() => {
        setPhase('interviewing');
        addMessage({
          sender: 'ai',
          content:
            'Xin chào anh! Em là trợ lý AI tư vấn mua xe điện VinFast. 🚗\n\nEm có thể giúp anh tìm xe phù hợp, tính toán chi phí, và đặt lịch lái thử — tất cả trong một cuộc trò chuyện.\n\nAnh đang tìm xe cho mục đích gì, và gia đình có bao nhiêu người ạ?',
        });
        setTyping(false);
      }, 1200);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Hero Section */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-0"
          >
            <HeroSection onStartChat={handleStartChat} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex flex-col bg-surface"
          >
            {/* Chat Header */}
            <ChatHeader onClose={() => setIsOpen(false)} />

            {/* Chat Body */}
            <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
              <ChatPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={handleStartChat}
          className={cn(
            'fixed bottom-6 right-6 z-40',
            'w-14 h-14 rounded-full',
            'bg-primary text-primary-foreground',
            'flex items-center justify-center',
            'btn-primary-glow',
            'hover:scale-105 active:scale-95',
            'transition-transform duration-200',
            'md:w-16 md:h-16'
          )}
          aria-label="Chat với AI tư vấn"
        >
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        </motion.button>
      )}
    </div>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────

function ChatHeader({ onClose }: { onClose: () => void }) {
  const { phase, resetChat } = useChatStore();

  const phaseLabels: Record<string, string> = {
    idle: 'Sẵn sàng',
    interviewing: 'Đang tìm hiểu nhu cầu',
    recommendation: 'Đề xuất xe phù hợp',
    detail: 'Xem chi tiết sản phẩm',
    financial: 'Tính toán tài chính',
    contact_info: 'Thu thập thông tin',
    booking: 'Đặt lịch lái thử',
    handoff: 'Chuyển nhân viên',
    completed: 'Hoàn tất',
  };

  return (
    <header
      className={cn(
        'shrink-0 px-4 py-3 flex items-center justify-between',
        'glass-strong',
        'border-b border-outline-variant/[0.08]'
      )}
    >
      <div className="flex items-center gap-3">
        {/* VinFast Logo Mark */}
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm font-[family-name:var(--font-plus-jakarta)]">
            VF
          </span>
        </div>
        <div>
          <h1
            className={cn(
              'text-sm font-bold text-on-surface leading-tight',
              'font-[family-name:var(--font-plus-jakarta)]'
            )}
          >
            VinFast AI Assistant
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <p className="text-[11px] text-on-surface-variant">
              {phaseLabels[phase] || 'Đang tư vấn'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={resetChat}
          className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
          aria-label="Cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className="min-h-screen flex flex-col mesh-gradient">
      {/* Navbar */}
      <nav className="shrink-0 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base font-[family-name:var(--font-plus-jakarta)]">
              VF
            </span>
          </div>
          <span
            className={cn(
              'text-lg font-bold text-on-surface tracking-tight',
              'font-[family-name:var(--font-plus-jakarta)]'
            )}
          >
            VinFast
          </span>
        </div>
        <button
          onClick={onStartChat}
          className={cn(
            'hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full',
            'bg-primary text-primary-foreground text-sm font-medium',
            'btn-primary-glow',
            'hover:opacity-90 active:scale-[0.97]',
            'transition-all duration-200',
            'font-[family-name:var(--font-inter)]'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Chat với AI
        </button>
      </nav>

      {/* Hero Content */}
      <div className="flex-1 flex items-center px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-medium uppercase tracking-widest text-primary">
              AI-Powered Sales Assistant
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className={cn(
              'text-4xl md:text-6xl lg:text-7xl font-bold text-on-surface leading-[0.95]',
              'tracking-tight',
              'font-[family-name:var(--font-plus-jakarta)]'
            )}
          >
            Tìm xe điện
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              hoàn hảo
            </span>
            <br />
            cho bạn.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed"
          >
            Trợ lý AI thông minh sẽ giúp bạn chọn xe phù hợp, tính toán chi phí
            trả góp, so sánh thuê vs mua pin — và đặt lịch lái thử chỉ trong vài phút.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onStartChat}
              className={cn(
                'group flex items-center gap-3 px-7 py-3.5 rounded-full',
                'bg-primary text-primary-foreground text-base font-semibold',
                'btn-primary-glow',
                'hover:opacity-90 active:scale-[0.97]',
                'transition-all duration-200',
                'font-[family-name:var(--font-inter)]'
              )}
            >
              Bắt đầu tư vấn
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 rounded-full',
                'text-on-surface-variant text-sm font-medium',
                'border border-outline-variant/20 hover:bg-surface-container-low',
                'transition-all duration-200',
                'font-[family-name:var(--font-inter)]'
              )}
            >
              Tìm hiểu thêm
              <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Feature Cards - Asymmetric Editorial Layout */}
      <section id="features" className="shrink-0 px-6 md:px-12 lg:px-20 pb-12 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <FeatureCard
            icon={<Calculator className="w-5 h-5" />}
            title="Tính toán tài chính"
            description="Chi phí trả góp, thuê pin, tiền điện — mọi thứ minh bạch, dễ hiểu."
            delay={0.8}
            accent
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="So sánh thông minh"
            description="VF3, VF5, VF6, VF8 — AI phân tích và đề xuất xe phù hợp nhất cho bạn."
            delay={0.9}
          />
          <FeatureCard
            icon={<Calendar className="w-5 h-5" />}
            title="Đặt lịch lái thử"
            description="Chọn showroom, khung giờ — chuyển cho nhân viên sale với đầy đủ thông tin."
            delay={1.0}
          />
        </div>
      </section>

      {/* Footer */}
      <footer
        className={cn(
          'shrink-0 px-6 md:px-12 py-6 flex items-center justify-between',
          'border-t border-outline-variant/[0.08]'
        )}
      >
        <p className="text-xs text-on-surface-variant">
          © 2025 VinFast AI Sales Assistant — Prototype Demo
        </p>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>Powered by AI</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  delay,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        'p-6 rounded-2xl transition-all duration-300',
        'hover:ambient-shadow',
        accent
          ? 'bg-primary/[0.04]'
          : 'bg-surface-container-lowest'
      )}
    >
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center mb-4',
          accent
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-container text-on-surface-variant'
        )}
      >
        {icon}
      </div>
      <h3
        className={cn(
          'text-base font-bold text-on-surface mb-2',
          'font-[family-name:var(--font-plus-jakarta)]'
        )}
      >
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
