import { create } from 'zustand';
import type { CarModel, Showroom } from '@/lib/vinfast-data';
import type { FinanceResult } from '@/lib/finance-calculator';

export type ChatPhase =
  | 'idle'
  | 'interviewing'
  | 'recommendation'
  | 'detail'
  | 'financial'
  | 'contact_info'
  | 'booking'
  | 'handoff'
  | 'completed';

export type MessageSender = 'user' | 'ai' | 'system';

export interface RichContent {
  type: 'car-card' | 'car-cards' | 'car-detail' | 'finance-table' | 'product-comparison' | 'booking-form' | 'contact-form' | 'profile-card';
  data?: unknown;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  richContent?: RichContent[];
  timestamp: Date;
  isTyping?: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  passengers: number;
  monthlyKm: number;
  monthlyIncome: number;
  totalBudget: number;
  monthlyBudget: number;
  downPaymentBudget: number;
  usage: string[];
  preferredShowroom: string;
}

export interface ChatStore {
  messages: ChatMessage[];
  phase: ChatPhase;
  isTyping: boolean;
  userProfile: UserProfile;
  recommendedCars: CarModel[];
  selectedCar: CarModel | null;
  financeResult: FinanceResult | null;
  selectedShowroom: Showroom | null;
  selectedSlot: { date: string; time: string } | null;
  isOpen: boolean;
  threadId: string | null;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setPhase: (phase: ChatPhase) => void;
  setTyping: (isTyping: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setRecommendedCars: (cars: CarModel[]) => void;
  setSelectedCar: (car: CarModel | null) => void;
  setFinanceResult: (result: FinanceResult | null) => void;
  setSelectedShowroom: (showroom: Showroom | null) => void;
  setSelectedSlot: (slot: { date: string; time: string } | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setThreadId: (id: string | null) => void;
  resetChat: () => void;
}

const defaultProfile: UserProfile = {
  name: '',
  phone: '',
  passengers: 4,
  monthlyKm: 1500,
  monthlyIncome: 0,
  totalBudget: 0,
  monthlyBudget: 12000000,
  downPaymentBudget: 300000000,
  usage: ['Đi làm hàng ngày', 'Chở gia đình cuối tuần'],
  preferredShowroom: '',
};

const initialState = {
  messages: [] as ChatMessage[],
  phase: 'idle' as ChatPhase,
  isTyping: false,
  userProfile: { ...defaultProfile },
  recommendedCars: [] as CarModel[],
  selectedCar: null as CarModel | null,
  financeResult: null as FinanceResult | null,
  selectedShowroom: null as Showroom | null,
  selectedSlot: null as { date: string; time: string } | null,
  isOpen: false,
  threadId: null as string | null,
};

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date() },
      ],
    })),

  setPhase: (phase) => set({ phase }),
  setTyping: (isTyping) => set({ isTyping }),
  updateProfile: (updates) => set((state) => ({ userProfile: { ...state.userProfile, ...updates } })),
  setRecommendedCars: (cars) => set({ recommendedCars: cars }),
  setSelectedCar: (car) => set({ selectedCar: car }),
  setFinanceResult: (result) => set({ financeResult: result }),
  setSelectedShowroom: (showroom) => set({ selectedShowroom: showroom }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setIsOpen: (isOpen) => set({ isOpen }),
  setThreadId: (id) => set({ threadId: id }),
  resetChat: () => set({ ...initialState, isOpen: true }),
}));
