import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Globe,
  Smartphone,
  Lock,
  Loader2,
  Check
} from 'lucide-react';
import { payxService, PayxPaymentMethod, PayxTransaction } from '../../services/payxService';
import confetti from 'canvas-confetti';

interface PayxPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  olympiadTitle: string;
  olympiadId?: string;
  onSuccess?: (transaction: PayxTransaction) => void;
}

export const PayxPaymentModal: React.FC<PayxPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  olympiadTitle,
  olympiadId,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PayxPaymentMethod>('payme');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedTxn, setCompletedTxn] = useState<PayxTransaction | null>(null);

  
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [customerName, setCustomerName] = useState('Azizbek Rahimov');
  const [customerEmail, setCustomerEmail] = useState('student@ibnsino.uz');

  const methods = [
    {
      id: 'payme' as PayxPaymentMethod,
      name: 'Payme',
      desc: 'Payme ilovasi va kartasi orqali to‘lov',
      badge: 'Chaqqon',
      badgeColor: 'bg-[#00CCCC]/10 text-[#00CCCC] border-[#00CCCC]/30',
      icon: '💳',
    },
    {
      id: 'click' as PayxPaymentMethod,
      name: 'Click Up',
      desc: 'Click merchant va QR code to‘lovi',
      badge: 'Ommabop',
      badgeColor: 'bg-[#0088FF]/10 text-[#0088FF] border-[#0088FF]/30',
      icon: '📲',
    },
    {
      id: 'uzumpay' as PayxPaymentMethod,
      name: 'Uzum Pay',
      desc: 'Uzum Bank va cashback hisobi',
      badge: 'Cashback 2%',
      badgeColor: 'bg-[#7000FF]/10 text-[#7000FF] border-[#7000FF]/30',
      icon: '🟣',
    },
    {
      id: 'paynet' as PayxPaymentMethod,
      name: 'Paynet',
      desc: 'Paynet terminal va ilovasi orqali',
      badge: 'Komissiyasiz',
      badgeColor: 'bg-[#00B050]/10 text-[#00B050] border-[#00B050]/30',
      icon: '🟢',
    },
    {
      id: 'uzcard_humo' as PayxPaymentMethod,
      name: 'Uzcard / Humo',
      desc: 'Milliy bank kartalari orqali to‘g‘ridan-to‘g‘ri',
      badge: 'Avto-tasdiq',
      badgeColor: 'bg-slate-900/10 text-slate-900 border-slate-900/30',
      icon: '🏛️',
    },
    {
      id: 'visa_mastercard' as PayxPaymentMethod,
      name: 'Visa / Mastercard',
      desc: 'Xalqaro kartalar bilan to‘lov',
      badge: 'USD / UZS',
      badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
      icon: '🌐',
    },
  ];

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const txn = await payxService.processPayment({
        amount,
        paymentMethod: selectedMethod,
        olympiadId,
        olympiadTitle,
        customerName,
        customerEmail,
      });

      setIsProcessing(false);
      setIsSuccess(true);
      setCompletedTxn(txn);
      confetti({ particleCount: 80, spread: 60 });

      if (onSuccess) {
        onSuccess(txn);
      }
    } catch (err) {
      setIsProcessing(false);
      alert("To'lov jarayonida xatolik yuz berdi!");
    }
  };

  const handleResetModal = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setCompletedTxn(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetModal} title="">
      <div className="space-y-6 font-sans">
        {!isSuccess ? (
          <>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 tracking-tight">PayX Gateway</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase border border-blue-100">
                      Multi-Pay
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Barcha turdagi to'lov tizimlari agregatori (payx.uz)</p>
                </div>
              </div>
            </div>

            
            <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-blue-400 tracking-wider">To'lov Summasi</span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {amount.toLocaleString()} <span className="text-sm font-bold text-slate-300">UZS</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-medium">{olympiadTitle}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>

            
            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                  To'lov Tizimini Tanlang (PayX Uzbek Payment Gateways)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {methods.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                        selectedMethod === m.id
                          ? 'border-blue-600 bg-blue-50/60 shadow-md shadow-blue-600/10 ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">{m.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              
              {(selectedMethod === 'uzcard_humo' || selectedMethod === 'visa_mastercard') && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Karta Ma'lumotlarini Kiriting</span>
                  </div>

                  <Input
                    label="Karta Raqami"
                    placeholder="8600 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Amal Qilish Muddati"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                    <Input
                      label="Karta Egasining Ismi"
                      placeholder="AZIZBEK RAHIMOV"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>PayX API Bilan Bog'lanilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-cyan-300" />
                      <span>PayX Orqali Muvaffaqiyatli To'lash</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          
          <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-50">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">To'lov Muvaffaqiyatli Amalga Oshirildi!</h3>
              <p className="text-xs text-slate-500 font-medium">
                PayX to'lov agregatori orqali transaksiya tasdiqlandi
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">PayX Ref kodi:</span>
                <span className="font-bold text-blue-600">{completedTxn?.payxRefCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">To'lov usuli:</span>
                <span className="font-bold uppercase text-slate-900">{completedTxn?.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-400">Summa:</span>
                <span className="font-bold text-emerald-600">{completedTxn?.amount.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vaqti:</span>
                <span className="text-slate-600">{new Date(completedTxn?.createdAt || '').toLocaleTimeString()}</span>
              </div>
            </div>

            <Button
              onClick={handleResetModal}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Yopish va Qatnashishni Boshlash
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
