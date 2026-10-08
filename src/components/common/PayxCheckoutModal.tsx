import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, QrCode, ArrowRight, ShieldCheck, Lock, ExternalLink, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { payxService, PayXInvoiceResponse, PayxPaymentMethod } from '../../services/payxService';
import confetti from 'canvas-confetti';

interface PayxCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  olympiadTitle: string;
  olympiadId: string;
  priceAmount: string | number;
  onSuccess: () => void;
}

export const PayxCheckoutModal: React.FC<PayxCheckoutModalProps> = ({
  isOpen,
  onClose,
  olympiadTitle,
  olympiadId,
  priceAmount,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PayxPaymentMethod>('payme');
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<PayXInvoiceResponse | null>(null);
  const [step, setStep] = useState<'select' | 'payx_checkout' | 'success'>('select');

  const numericAmount = typeof priceAmount === 'number' ? priceAmount : parseInt(priceAmount.toString().replace(/\D/g, '')) || 35000;

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setInvoice(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleCreatePayXInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const orderId = `order_${olympiadId}_${Date.now()}`;
      const inv = await payxService.createInvoice({
        amount: numericAmount,
        orderId,
        olympiadId,
        olympiadTitle,
        userEmail: 'user@ibnsino.uz',
        userName: 'Foydalanuvchi',
        paymentMethod: selectedMethod,
      });

      setInvoice(inv);
      setStep('payx_checkout');
    } catch (err) {
      alert("PayX to'lov invoysi yaratishda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayXPayment = async () => {
    if (!invoice) return;
    setIsLoading(true);

    try {
      await payxService.processPayment(invoice.invoiceId, selectedMethod);
      confetti({ particleCount: 80, spread: 60 });
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      alert("To'lovni tasdiqlashda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="PayX Rasmiy To'lov Gateway" size="lg">
      <div className="space-y-6 font-sans">
        
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border border-blue-800/80 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-400/30">
                PayX OpenAPI Secured
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-white truncate max-w-xs">{olympiadTitle}</h3>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">To'lov Summasi</div>
            <div className="text-xl font-black text-cyan-400 font-mono">{numericAmount.toLocaleString()} UZS</div>
          </div>
        </div>

        
        {step === 'select' && (
          <form onSubmit={handleCreatePayXInvoice} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider">
                To'lov Tizimini Tanlang (PayX Merchant System)
              </label>

              <div className="grid grid-cols-2 gap-3">
                
                <div
                  onClick={() => setSelectedMethod('payme')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === 'payme'
                      ? 'border-cyan-500 bg-cyan-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00CCCC] text-white font-black flex items-center justify-center text-sm shadow-xs">
                      payme
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Payme</div>
                      <div className="text-[10px] text-slate-400">Tezkor to'lov</div>
                    </div>
                  </div>
                  {selectedMethod === 'payme' && <CheckCircle2 className="w-5 h-5 text-cyan-600" />}
                </div>

                
                <div
                  onClick={() => setSelectedMethod('click')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === 'click'
                      ? 'border-blue-600 bg-blue-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0070BA] text-white font-black flex items-center justify-center text-sm shadow-xs">
                      click
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Click Pass</div>
                      <div className="text-[10px] text-slate-400">Click Evolution</div>
                    </div>
                  </div>
                  {selectedMethod === 'click' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </div>

                
                <div
                  onClick={() => setSelectedMethod('uzumpay')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === 'uzumpay'
                      ? 'border-purple-600 bg-purple-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7000FF] text-white font-black flex items-center justify-center text-sm shadow-xs">
                      uzum
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Uzum Bank</div>
                      <div className="text-[10px] text-slate-400">0% komissiya</div>
                    </div>
                  </div>
                  {selectedMethod === 'uzumpay' && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                </div>

                
                <div
                  onClick={() => setSelectedMethod('uzcard_humo')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedMethod === 'uzcard_humo'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Uzcard / Humo</div>
                      <div className="text-[10px] text-slate-400">Visa & Mastercard</div>
                    </div>
                  </div>
                  {selectedMethod === 'uzcard_humo' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>PayX Orqali Invoys Yaratish</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        
        {step === 'payx_checkout' && invoice && (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">PayX Invoys ID:</span>
                <span className="font-mono font-bold text-slate-900">{invoice.invoiceId}</span>
              </div>

              
              <div className="w-44 h-44 bg-white p-3 border border-slate-200 rounded-2xl mx-auto shadow-sm flex items-center justify-center">
                <img src={invoice.qrCodeUrl} alt="PayX QR Code" className="w-full h-full object-contain" />
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Telefoningiz orqali <strong>{selectedMethod.toUpperCase()}</strong> ilovasida QR-kodni skanerlang yoki quyidagi tugmani bosing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={handleConfirmPayXPayment}
                isLoading={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl shadow-md shadow-emerald-600/20"
              >
                To'lovni Amalga Oshirdim (Tasdiqlash)
              </Button>
            </div>
          </div>
        )}

        
        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">To'lov Muvaffaqiyatli O'tdi!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                PayX to'lov kvitansiyasi tasdiqlandi. Endi musobaqada qatnashishingiz mumkin!
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
