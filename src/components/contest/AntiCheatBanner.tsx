import React from 'react';
import { ShieldAlert, AlertTriangle, XCircle, ShieldX } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useContestStore } from '../../store/useContestStore';
import { useTranslation } from 'react-i18next';

export const AntiCheatBanner: React.FC = () => {
  const { t } = useTranslation();
  const showAntiCheatModal = useContestStore((state) => state.showAntiCheatModal);
  const violationCount = useContestStore((state) => state.violationCount);
  const maxViolations = useContestStore((state) => state.maxViolations);
  const latestViolationMessage = useContestStore((state) => state.latestViolationMessage);
  const latestViolationType = useContestStore((state) => state.latestViolationType);
  const isDisqualified = useContestStore((state) => state.isDisqualified);
  const disqualifyReason = useContestStore((state) => state.disqualifyReason);
  const closeAntiCheatModal = useContestStore((state) => state.closeAntiCheatModal);

  const isCritical = violationCount >= maxViolations || isDisqualified;

  return (
    <Modal
      isOpen={showAntiCheatModal}
      onClose={isCritical ? () => {} : closeAntiCheatModal}
      title={isCritical ? 'DISKVALIFIKATSIYA OGOHLANTIRISHI' : t('contest.antiCheatWarning')}
      size="md"
    >
      <div className="flex flex-col items-center text-center p-2 space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isCritical
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-rose-100 text-rose-600 animate-bounce'
          }`}
        >
          {isCritical ? <ShieldX className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-bold text-accent-900">
            {isCritical
              ? "Imtihondan chetlatildingiz!"
              : `Xavfsizlik qoidabuzarligi (${violationCount}/${maxViolations})`}
          </h4>
          <p className="text-sm text-accent-600 leading-relaxed font-medium">
            {isCritical
              ? (disqualifyReason || "Siz ruxsat etilgan qoidabuzarliklar chegarasidan oshdingiz. Natijangiz bekor qilindi.")
              : (latestViolationMessage || t('contest.tabSwitchAlert'))}
          </p>
          {latestViolationType && !isCritical && (
            <span className="inline-block px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-mono font-bold">
              Aniqlangan kod: {latestViolationType}
            </span>
          )}
        </div>

        <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 text-left flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            Barcha harakatlar (klaviatura, oyna almashtirish, nusxa olish, DevTools, ekran o'lchamlari) Next Olymp ExamGuard va AI Proktoring markazi tomonidan qayd etilmoqda.
          </span>
        </div>

        {isCritical ? (
          <Button
            variant="danger"
            className="w-full font-bold"
            onClick={() => {
              closeAntiCheatModal();
              window.location.href = '/student/olympiads';
            }}
          >
            Bosh sahifaga qaytish
          </Button>
        ) : (
          <Button variant="danger" className="w-full" onClick={closeAntiCheatModal}>
            Tushundim, musobaqaga qaytish
          </Button>
        )}
      </div>
    </Modal>
  );
};

