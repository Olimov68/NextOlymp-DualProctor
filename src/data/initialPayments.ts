export interface PaymentTransaction {
  id: string;
  userName: string;
  userPhone: string;
  userRole: 'student' | 'teacher';
  olympiadOrPackage: string;
  method: 'karta' | 'naqd' | 'hamyon' | 'paket';
  amount: number;
  status: 'muvaffaqiyatli' | 'kutilmoqda' | 'bekor_qilindi';
  date: string;
  transactionRef: string;
}

export const INITIAL_PAYMENTS: PaymentTransaction[] = [];
