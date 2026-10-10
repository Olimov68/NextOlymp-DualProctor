

import QRCode from 'qrcode';

export type PayxPaymentMethod = 'payme' | 'click' | 'uzumpay' | 'paynet' | 'uzcard_humo' | 'visa_mastercard' | 'card' | 'all' | 'uzum';

export interface PayxConfig {
  merchantId: string;
  publicKey?: string;
  mode: 'live' | 'sandbox';
  apiUrl: string;
}

export interface PayXCreateInvoiceParams {
  amount: number;
  currency?: 'UZS' | 'USD';
  orderId: string;
  olympiadId: string;
  olympiadTitle: string;
  userEmail: string;
  userName: string;
  paymentMethod?: PayxPaymentMethod;
  returnUrl?: string;
}

export interface PayXInvoiceResponse {
  success: boolean;
  invoiceId: string;
  checkoutUrl: string;
  qrCodeUrl: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface PayXTransactionStatus {
  orderId: string;
  invoiceId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface PayxTransaction {
  id: string;
  amount: number;
  paymentMethod: PayxPaymentMethod;
  status: 'completed' | 'pending' | 'failed';
  payxRefCode: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  olympiadTitle?: string;
  olympiadId?: string;
}

export interface PayxProcessPaymentParams {
  amount: number;
  paymentMethod: PayxPaymentMethod;
  olympiadId?: string;
  olympiadTitle?: string;
  customerName?: string;
  customerEmail?: string;
}

type Subscriber = () => void;

// SECURITY NOTICE (Item 10): Payment secret keys MUST NEVER be stored in the frontend codebase.
// All secret keys and payment validations must reside strictly on the server backend.
const defaultConfig: PayxConfig = {
  merchantId: (import.meta as any).env?.VITE_PAYX_MERCHANT_ID || 'PAYX-MERCHANT-IBN-SINO',
  publicKey: (import.meta as any).env?.VITE_PAYX_PUBLIC_KEY || '',
  mode: 'sandbox',
  apiUrl: (import.meta as any).env?.VITE_PAYX_API_URL || 'https://api.payx.uz/v1',
};

const subscribers: Set<Subscriber> = new Set();

const notifySubscribers = () => {
  subscribers.forEach((sub) => sub());
};

const inMemoryInvoices = new Map<string, any>();
let inMemoryTransactions: PayxTransaction[] = [
  {
    id: 'payx_tx_101',
    amount: 35000,
    paymentMethod: 'payme',
    status: 'completed',
    payxRefCode: 'PX-982410',
    customerName: 'Jasurbek Alimov',
    customerEmail: 'jasur@ibnsino.uz',
    olympiadTitle: 'Respublika Matematika II Bosqich',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'payx_tx_102',
    amount: 35000,
    paymentMethod: 'click',
    status: 'completed',
    payxRefCode: 'PX-881294',
    customerName: 'Nilufar Usmonova',
    customerEmail: 'nilufar@ibnsino.uz',
    olympiadTitle: 'Informatika ICPC Final',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];
let inMemoryConfig: PayxConfig = defaultConfig;

export const payxService = {
  getConfig(): PayxConfig {
    return inMemoryConfig;
  },

  updateConfig(partial: Partial<PayxConfig>): PayxConfig {
    inMemoryConfig = { ...inMemoryConfig, ...partial };
    notifySubscribers();
    return inMemoryConfig;
  },

  getTransactions(): PayxTransaction[] {
    return inMemoryTransactions;
  },

  subscribe(callback: Subscriber): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  getVolumeByMethod(method: PayxPaymentMethod): number {
    const txns = this.getTransactions();
    return txns
      .filter((t) => t.paymentMethod === method && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalVolume(): number {
    const txns = this.getTransactions();
    return txns
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  
  async createInvoice(params: PayXCreateInvoiceParams): Promise<PayXInvoiceResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
    const invoiceId = `payx_inv_${Date.now()}_${randomSuffix}`;
    const checkoutUrl = `https://payx.uz/checkout/${invoiceId}?merchant=${this.getConfig().merchantId}`;
    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(checkoutUrl, { width: 250 });
    } catch {
      qrCodeUrl = '';
    }

    const response: PayXInvoiceResponse = {
      success: true,
      invoiceId,
      checkoutUrl,
      qrCodeUrl,
      amount: params.amount,
      currency: params.currency || 'UZS',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    inMemoryInvoices.set(params.orderId, response);
    return response;
  },

  
  async processPayment(params: PayxProcessPaymentParams | string, method?: string): Promise<PayxTransaction> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let amount = 35000;
    let paymentMethod: PayxPaymentMethod = 'payme';
    let customerName = 'Ishtirokchi';
    let customerEmail = 'user@ibnsino.uz';
    let olympiadTitle = 'Respublika Matematika II Bosqich';

    if (typeof params === 'object') {
      amount = params.amount;
      paymentMethod = params.paymentMethod;
      if (params.customerName) customerName = params.customerName;
      if (params.customerEmail) customerEmail = params.customerEmail;
      if (params.olympiadTitle) olympiadTitle = params.olympiadTitle;
    } else if (typeof method === 'string') {
      paymentMethod = method as PayxPaymentMethod;
    }

    const txn: PayxTransaction = {
      id: `payx_tx_${Date.now()}`,
      amount,
      paymentMethod,
      status: 'completed',
      payxRefCode: (() => {
        const buf = new Uint32Array(1);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf);
        return `PX-${100000 + (buf[0] % 900000)}`;
      })(),
      customerName,
      customerEmail,
      olympiadTitle,
      createdAt: new Date().toISOString(),
    };

    inMemoryTransactions = [txn, ...inMemoryTransactions];
    notifySubscribers();

    return txn;
  },

  
  async checkStatus(orderId: string): Promise<PayXTransactionStatus> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const invoice = inMemoryInvoices.get(orderId);
    if (invoice) {
      return {
        orderId,
        invoiceId: invoice.invoiceId,
        status: invoice.status || 'pending',
        paidAt: invoice.status === 'paid' ? new Date().toISOString() : undefined,
        paymentMethod: 'PayX (Payme/Click/Uzcard)',
        transactionId: `payx_tx_${Date.now()}`,
      };
    }

    return {
      orderId,
      invoiceId: `inv_${orderId}`,
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: 'PayX Unified Checkout',
      transactionId: `payx_tx_${Date.now()}`,
    };
  }
};
