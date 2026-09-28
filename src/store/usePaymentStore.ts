import { create } from 'zustand';
import { PaymentTransaction, INITIAL_PAYMENTS } from '../data/initialPayments';

const STORAGE_KEY = 'next_olymp_payments';

const getStoredPayments = (): PaymentTransaction[] => {
  if (typeof window === 'undefined') return INITIAL_PAYMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for payments:', e);
  }
  return INITIAL_PAYMENTS;
};

const persistPayments = (items: PaymentTransaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for payments:', e);
  }
};

interface PaymentStore {
  payments: PaymentTransaction[];
  addPayment: (payment: Omit<PaymentTransaction, 'id' | 'date'>) => void;
  updatePaymentStatus: (id: string, status: PaymentTransaction['status']) => void;
  deletePayment: (id: string) => void;
  generateFinancialSummary: () => string;
  resetPayments: () => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: getStoredPayments(),

  addPayment: (newPay) => {
    const current = get().payments;
    const nextIdNum = 99201 + current.length + 1;
    const id = `TRX-${nextIdNum}`;

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const paymentItem: PaymentTransaction = {
      ...newPay,
      id,
      date,
    };

    const updated = [paymentItem, ...current];
    persistPayments(updated);
    set({ payments: updated });
  },

  updatePaymentStatus: (id, status) => {
    const updated = get().payments.map((p) => (p.id === id ? { ...p, status } : p));
    persistPayments(updated);
    set({ payments: updated });
  },

  deletePayment: (id) => {
    const updated = get().payments.filter((p) => p.id !== id);
    persistPayments(updated);
    set({ payments: updated });
  },

  generateFinancialSummary: () => {
    const list = get().payments;
    const totalRev = list.reduce((sum, p) => (p.status === 'muvaffaqiyatli' ? sum + p.amount : sum), 0);
    const cardRev = list.reduce(
      (sum, p) => (p.method === 'karta' && p.status === 'muvaffaqiyatli' ? sum + p.amount : sum),
      0
    );
    const cashRev = list.reduce(
      (sum, p) => (p.method === 'naqd' && p.status === 'muvaffaqiyatli' ? sum + p.amount : sum),
      0
    );
    const walletRev = list.reduce(
      (sum, p) => (p.method === 'hamyon' && p.status === 'muvaffaqiyatli' ? sum + p.amount : sum),
      0
    );
    const pkgCount = list.filter((p) => p.method === 'paket').length;

    return (
      `📊 NEXTOLYMP MOLIYA VA TUSHUMLAR TAHLILI:\n\n` +
      `1. JAMI TUSHUM: ${totalRev.toLocaleString()} UZS\n` +
      `2. KARTA ORQALI (Click / Payme / Uzum): ${cardRev.toLocaleString()} UZS\n` +
      `3. NAQD / BANK TRANSAKSIYASI: ${cashRev.toLocaleString()} UZS\n` +
      `4. ICHKI HAMYON (BALANS): ${walletRev.toLocaleString()} UZS\n` +
      `5. PAKET OBUNASI ORQALI QATNASHUVCHILAR: ${pkgCount} kishi\n\n` +
      `💡 Barcha ko'rsatkichlar real tranzaksiyalar bo'yicha dinamik shakllantiriladi.`
    );
  },

  resetPayments: () => {
    persistPayments([]);
    set({ payments: [] });
  },
}));
