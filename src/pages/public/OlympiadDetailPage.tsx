import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOlympiadDetail } from '../../hooks/useOlympiad';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PayxPaymentModal } from '../../components/common/PayxPaymentModal';
import { Clock, Trophy, Users, CheckCircle2, ShieldCheck, ArrowLeft, Play, Award, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const OlympiadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: olympiad, isLoading } = useOlympiadDetail(id || '');
  const { isAuthenticated, user } = useAuth();
  const [isPayxModalOpen, setIsPayxModalOpen] = useState(false);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-accent-500 font-sans">Musobaqa ma'lumotlari yuklanmoqda...</div>;
  }

  if (!olympiad) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4 font-sans">
        <h2 className="text-2xl font-bold text-accent-900">Musobaqa topilmadi</h2>
        <Button onClick={() => navigate('/olympiads')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Musobaqalarga qaytish
        </Button>
      </div>
    );
  }

  const handleStartContest = () => {
    if (!isAuthenticated) {
      navigate('/auth/register');
      return;
    }
    const price = Number(olympiad.price || 0);
    if (price > 0) {
      setIsPayxModalOpen(true);
    } else {
      navigate(`/olympiads/${olympiad.id}/participate`);
    }
  };

  const handlePaymentSuccess = () => {
    setIsPayxModalOpen(false);
    navigate(`/olympiads/${olympiad.id}/participate`);
  };

  const price = Number(olympiad.price || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans">
      <Button variant="ghost" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
        Orqaga qaytish
      </Button>

      
      <div className="relative rounded-3xl bg-accent-950 text-white overflow-hidden shadow-2xl border border-accent-800 p-8 sm:p-12 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge subject={olympiad.subject} />
          <Badge status={olympiad.status} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl">
          {olympiad.title}
        </h1>

        <p className="text-accent-300 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
          {olympiad.description}
        </p>

        <div className="pt-4 border-t border-accent-800 flex flex-wrap gap-6 text-xs sm:text-sm text-accent-300">
          {olympiad.durationMinutes ? (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              <span>Davomiyligi: <strong className="text-white">{olympiad.durationMinutes} daqiqa</strong></span>
            </div>
          ) : null}
          {olympiad.maxScore ? (
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Maksimal ball: <strong className="text-white">{olympiad.maxScore} ball</strong></span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary-400" />
            <span>Ishtirokchilar: <strong className="text-white">{olympiad.participantsCount || 0} ta</strong></span>
          </div>
          {price > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>To'lov tizimlari: <strong className="text-emerald-400">PayX (Payme, Click, Uzum, Paynet, Uzcard/Humo)</strong></span>
            </div>
          )}
        </div>

        <div className="pt-2">
          {olympiad.status === 'active' ? (
            <Button size="lg" variant="primary" onClick={handleStartContest} leftIcon={<Play className="w-5 h-5 fill-white" />}>
              {price > 0 ? `PayX Orqali Qatnashish (${price.toLocaleString()} UZS)` : "Musobaqaga kirish"}
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-amber-300 text-sm font-semibold border border-white/10">
              <AlertCircle className="w-5 h-5" />
              <span>Musobaqa hali boshlanmadi yoki yakunlangan.</span>
            </div>
          )}
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-accent-900 border-b border-border pb-3">
              Musobaqa Shartlari va Bosqichlar
            </h3>
            <ul className="space-y-3 text-sm text-accent-700">
              {price > 0 && (
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>PayX gateway (payx.uz/docs) orqali Payme, Click, Uzum Pay, Paynet yoki Uzcard/Humo yordamida to'lov qiling.</span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Timer server-side sinxronlanadi va berilgan daqiqa tugagach avtomatik submit bo'ladi.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Brauzer sahifasidan chiqish va tab almashish Anti-Cheat tizimi tomonidan qayd etiladi.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-accent-900 border-b border-border pb-3">
              Ishtirok Etish Huquqi (Eligibility)
            </h3>
            <div className="text-sm text-accent-700 space-y-2">
              <p>Ruxsat berilgan sinflar: <strong className="text-accent-900">{olympiad.eligibility?.grades?.join(', ') || '5-11'}-sinflar</strong></p>
              <p>Hudud: <strong className="text-accent-900">O'zbekistonning barcha viloyat va shaharlari</strong></p>
            </div>
          </div>
        </div>

        
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Award className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-extrabold">Mukofotlar va Sovrinlar</h3>
            </div>
            <div className="space-y-3">
              {olympiad.prizes?.map((prize, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {prize.place}-o'rin: {prize.title}
                  </span>
                  <p className="text-xs font-semibold text-accent-900">{prize.reward}</p>
                </div>
              )) || <p className="text-xs text-slate-500">Mukofotlar musobaqa boshlanishida e'lon qilinadi.</p>}
            </div>
          </div>
        </div>
      </div>

      
      {price > 0 && (
        <PayxPaymentModal
          isOpen={isPayxModalOpen}
          onClose={() => setIsPayxModalOpen(false)}
          amount={price}
          olympiadTitle={olympiad.title}
          olympiadId={olympiad.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

