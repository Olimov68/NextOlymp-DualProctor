import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Video,
  Mic,
  Globe,
  Wifi,
  ChevronDown,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { AntiCheatConfig, ProctoringPresetMode } from '../../types';
import { clsx } from 'clsx';

interface AntiCheatSettingsEditorProps {
  config: AntiCheatConfig;
  onChange: (newConfig: AntiCheatConfig) => void;
  onSave: () => void | Promise<void>;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export const AntiCheatSettingsEditor: React.FC<AntiCheatSettingsEditorProps> = ({
  config,
  onChange,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
}) => {
  // Accordions open/close state
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    camera: true,
    audio: false,
    browser: true,
    network: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = <K extends keyof AntiCheatConfig>(key: K, value: AntiCheatConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  // Presets handler
  const handleApplyPreset = (mode: ProctoringPresetMode) => {
    if (mode === 'STRICT') {
      onChange({
        ...config,
        proctoringMode: 'STRICT',
        requireBothEyesVisible: true,
        strictFaceCheck: true,
        trackGazeDirection: true,
        maxAbsenceGracePeriod: 1.5,
        minFaceConfidence: 0.70,
        maxViolationsAllowed: 3,
        requireWebcam: true,
        cameraFaceSnapshotEnabled: true,
        snapshotOnMultipleFaces: true,
        snapshotOnNoFace: true,
        blockTabSwitch: true,
        blockCopyPaste: true,
        requireFullscreen: true,
        blockDevTools: true,
        blockDuplicateIP: true,
        heartbeatIntervalSec: 5,
      });
    } else if (mode === 'STANDARD') {
      onChange({
        ...config,
        proctoringMode: 'STANDARD',
        requireBothEyesVisible: true,
        strictFaceCheck: true,
        trackGazeDirection: false,
        maxAbsenceGracePeriod: 3.0,
        minFaceConfidence: 0.65,
        maxViolationsAllowed: 4,
        requireWebcam: true,
        cameraFaceSnapshotEnabled: true,
        snapshotOnMultipleFaces: true,
        snapshotOnNoFace: true,
        blockTabSwitch: true,
        blockCopyPaste: true,
        requireFullscreen: true,
        blockDevTools: true,
        blockDuplicateIP: true,
        heartbeatIntervalSec: 10,
      });
    } else if (mode === 'RELAXED') {
      onChange({
        ...config,
        proctoringMode: 'RELAXED',
        requireBothEyesVisible: false,
        strictFaceCheck: false,
        trackGazeDirection: false,
        maxAbsenceGracePeriod: 5.0,
        minFaceConfidence: 0.50,
        maxViolationsAllowed: 5,
        requireWebcam: true,
        cameraFaceSnapshotEnabled: true,
        snapshotOnMultipleFaces: true,
        snapshotOnNoFace: false,
        blockTabSwitch: true,
        blockCopyPaste: false,
        requireFullscreen: false,
        blockDevTools: false,
        blockDuplicateIP: false,
        heartbeatIntervalSec: 15,
      });
    } else if (mode === 'DISABLED') {
      onChange({
        ...config,
        proctoringMode: 'DISABLED',
        requireBothEyesVisible: false,
        strictFaceCheck: false,
        trackGazeDirection: false,
        requireWebcam: false,
        requireVoiceBiometrics: false,
        detectUnknownSpeakers: false,
        detectMultipleSpeakers: false,
        cameraFaceSnapshotEnabled: false,
      });
    }
  };

  // Count active rules
  const activeCount = [
    config.enabled && config.requireWebcam,
    config.enabled && config.requireBothEyesVisible,
    config.enabled && config.strictFaceCheck,
    config.enabled && config.trackGazeDirection,
    config.enabled && config.requireVoiceBiometrics,
    config.enabled && config.detectUnknownSpeakers,
    config.enabled && config.detectMultipleSpeakers,
    config.enabled && config.blockTabSwitch,
    config.enabled && config.blockCopyPaste,
    config.enabled && config.requireFullscreen,
    config.enabled && config.blockDevTools,
    config.enabled && config.blockDuplicateIP,
    config.enabled && config.cameraFaceSnapshotEnabled,
  ].filter(Boolean).length;

  const isDisabled = !config.enabled;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Master Header (Compact) */}
      <div className="p-4 rounded-2xl bg-[#091124] border border-[#1a2d54] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white">Anti-Cheat Nazorati</h2>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                config.enabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-700/30 text-slate-400 border-slate-700/50"
              )}
            >
              {config.enabled ? `${activeCount} ta faol qoida` : "Tizim o‘chirilgan"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Rejim: <strong className="text-slate-200 uppercase">{config.proctoringMode ?? 'STRICT'}</strong></span>
            {hasUnsavedChanges && (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3" /> Saqlanmagan o‘zgarishlar
              </span>
            )}
          </div>
        </div>

        {/* Master Switch & Sticky Save */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2.5 cursor-pointer bg-[#0d1832] px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-colors">
            <span className="text-xs font-bold text-slate-200">
              {config.enabled ? "Bosh Switch [Yoqilgan]" : "Bosh Switch [O‘chirilgan]"}
            </span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateField('enabled', e.target.checked)}
              aria-label="Anti-Cheat tizimini to‘liq yoqish yoki o‘chirish"
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span>Saqlanmoqda...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Preset Segmented Control (Single Row) */}
      <label className="flex items-center gap-2 rounded-xl border border-white/10 p-3 text-slate-300">
        <input type="checkbox" disabled={isDisabled || isSaving} checked={config.requireDualDevice ?? false}
          onChange={e => updateField('requireDualDevice', e.target.checked)} />
        Ikkinchi kamerani talab qilish — serverdagi Vision provayderi sozlangan bo‘lishi shart.
      </label>
      <div className="p-2.5 rounded-xl bg-[#091124] border border-[#1a2d54] flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
          Preset Rejimlar:
        </span>
        <div className="flex items-center gap-1.5 bg-[#0d1832] p-1 rounded-xl border border-white/10 shrink-0">
          {(['STRICT', 'STANDARD', 'RELAXED', 'DISABLED'] as ProctoringPresetMode[]).map((mode) => {
            const isSelected = config.proctoringMode === mode;
            const labels: Record<ProctoringPresetMode, string> = {
              STRICT: "Qat’iy (Strict)",
              STANDARD: "O‘rtacha (Standard)",
              RELAXED: "Yumshoq (Relaxed)",
              DISABLED: "Off (Faqat Brauzer)",
            };
            return (
              <button
                key={mode}
                type="button"
                disabled={isDisabled}
                onClick={() => handleApplyPreset(mode)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Four Compact Accordions */}
      <div className="space-y-2.5">
        
        {/* Accordion 1: Kamera va AI */}
        <div className="rounded-2xl bg-[#091124] border border-[#1a2d54] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('camera')}
            className="w-full px-4 py-3 bg-[#0d1832]/60 flex items-center justify-between cursor-pointer hover:bg-[#0d1832] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">Kamera va AI Yuz Tahlili</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MediaPipe Face Mesh (478 nuqta)
              </span>
            </div>
            <ChevronDown
              className={clsx("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.camera && "rotate-180 text-emerald-400")}
            />
          </button>

          {openSections.camera && (
            <div className="p-3 divide-y divide-white/5 space-y-1">
              {/* Row: Web-kamera majburiy */}
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Web-kamera ulanishi majburiy</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.requireWebcam ?? true}
                  onChange={(e) => updateField('requireWebcam', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Row: Ikkala ko‘z */}
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Ikkala ko‘z to‘liq ko‘rinishi shart (Both Eyes)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.requireBothEyesVisible ?? true}
                  onChange={(e) => updateField('requireBothEyesVisible', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Row: Landmarks */}
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Landmarks tekshiruvi (Burun, iyak, peshona)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.strictFaceCheck ?? true}
                  onChange={(e) => updateField('strictFaceCheck', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Row: Gaze */}
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Nigoh nazorati va chetga qarash (Gaze Tracking)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.trackGazeDirection ?? true}
                  onChange={(e) => updateField('trackGazeDirection', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Row: Parameters in compact row */}
              <div className="pt-2 px-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0d1832] border border-white/10">
                  <span className="text-[11px] text-slate-400">Grace Period:</span>
                  <select
                    disabled={isDisabled}
                    value={config.maxAbsenceGracePeriod ?? 1.5}
                    onChange={(e) => updateField('maxAbsenceGracePeriod', Number(e.target.value))}
                    className="p-1 rounded bg-[#091124] border border-white/20 text-xs font-mono font-bold text-emerald-400 outline-none"
                  >
                    <option value={1.0}>1.0s (Qat’iy)</option>
                    <option value={1.5}>1.5s</option>
                    <option value={3.0}>3.0s (O‘rtacha)</option>
                    <option value={5.0}>5.0s (Yumshoq)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0d1832] border border-white/10">
                  <span className="text-[11px] text-slate-400">Confidence:</span>
                  <select
                    disabled={isDisabled}
                    value={config.minFaceConfidence ?? 0.65}
                    onChange={(e) => updateField('minFaceConfidence', Number(e.target.value))}
                    className="p-1 rounded bg-[#091124] border border-white/20 text-xs font-mono font-bold text-cyan-400 outline-none"
                  >
                    <option value={0.50}>50%</option>
                    <option value={0.65}>65% (Optimal)</option>
                    <option value={0.75}>75%</option>
                    <option value={0.85}>85%</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0d1832] border border-white/10">
                  <span className="text-[11px] text-slate-400">Limit (Chegara):</span>
                  <select
                    disabled={isDisabled}
                    value={config.maxViolationsAllowed ?? 3}
                    onChange={(e) => updateField('maxViolationsAllowed', Number(e.target.value))}
                    className="p-1 rounded bg-[#091124] border border-white/20 text-xs font-mono font-bold text-rose-400 outline-none"
                  >
                    <option value={1}>1 ta (Darhol)</option>
                    <option value={2}>2 ta</option>
                    <option value={3}>3 ta (Standart)</option>
                    <option value={5}>5 ta</option>
                    <option value={10}>10 ta</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 p-3 text-xs text-slate-400">
          Ovoz biometriyasi, begona ovoz va pichirlash tahlili mavjud emas: tekshirilgan model ulanmagan. Bu qoidalar serverda ham o‘chiq.
        </div>

        {/* Accordion 3: Brauzer himoyasi */}
        <div className="rounded-2xl bg-[#091124] border border-[#1a2d54] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('browser')}
            className="w-full px-4 py-3 bg-[#0d1832]/60 flex items-center justify-between cursor-pointer hover:bg-[#0d1832] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs text-white">Brauzer va Ekran Himoyasi</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Tab, Fullscreen & Klaviatura
              </span>
            </div>
            <ChevronDown
              className={clsx("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.browser && "rotate-180 text-amber-400")}
            />
          </button>

          {openSections.browser && (
            <div className="p-3 divide-y divide-white/5 space-y-1">
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Tab almashishni cheklash va qayd etish (Tab Switch Detection)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.blockTabSwitch ?? true}
                  onChange={(e) => updateField('blockTabSwitch', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Matndan nusxa olish va joylashni cheklash (Copy/Paste Restriction)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.blockCopyPaste ?? true}
                  onChange={(e) => updateField('blockCopyPaste', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">To‘liq ekran rejimi talab etiladi (Require Fullscreen)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.requireFullscreen ?? true}
                  onChange={(e) => updateField('requireFullscreen', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Dasturchi asboblarini cheklash va serverda qayd etish (DevTools / F12)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.blockDevTools ?? true}
                  onChange={(e) => updateField('blockDevTools', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accordion 4: Tarmoq va dalillar */}
        <div className="rounded-2xl bg-[#091124] border border-[#1a2d54] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection('network')}
            className="w-full px-4 py-3 bg-[#0d1832]/60 flex items-center justify-between cursor-pointer hover:bg-[#0d1832] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-xs text-white">Tarmoq va Proktorlik Dalillari</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                IP, Heartbeat & Snapshot
              </span>
            </div>
            <ChevronDown
              className={clsx("w-4 h-4 text-slate-400 transition-transform duration-200", openSections.network && "rotate-180 text-purple-400")}
            />
          </button>

          {openSections.network && (
            <div className="p-3 divide-y divide-white/5 space-y-1">
              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Takroriy IP-manzillarni bloklash (Single Session per IP)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.blockDuplicateIP ?? true}
                  onChange={(e) => updateField('blockDuplicateIP', e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Server Heartbeat monitoringini yoqish (Continuous Heartbeat)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.heartbeatEnabled ?? true}
                  onChange={(e) => updateField('heartbeatEnabled', e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Kameradan avtomatik snapshot olish (Anomaly Evidence)</span>
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={config.cameraFaceSnapshotEnabled ?? true}
                  onChange={(e) => updateField('cameraFaceSnapshotEnabled', e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Bir nechta yuz ko‘ringanda snapshot olish</span>
                <input
                  type="checkbox"
                  disabled={isDisabled || !config.cameraFaceSnapshotEnabled}
                  checked={config.snapshotOnMultipleFaces ?? true}
                  onChange={(e) => updateField('snapshotOnMultipleFaces', e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="h-11 px-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors">
                <span className="text-xs text-slate-300 font-medium">Yuz yo‘qolganda snapshot olish</span>
                <input
                  type="checkbox"
                  disabled={isDisabled || !config.cameraFaceSnapshotEnabled}
                  checked={config.snapshotOnNoFace ?? true}
                  onChange={(e) => updateField('snapshotOnNoFace', e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 px-3">
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#0d1832] border border-white/10 max-w-xs">
                  <span className="text-[11px] text-slate-400">Heartbeat Interval:</span>
                  <select
                    disabled={isDisabled}
                    value={config.heartbeatIntervalSec ?? 10}
                    onChange={(e) => updateField('heartbeatIntervalSec', Number(e.target.value))}
                    className="p-1 rounded bg-[#091124] border border-white/20 text-xs font-mono font-bold text-purple-400 outline-none"
                  >
                    <option value={5}>5 soniya</option>
                    <option value={10}>10 soniya (Tavsiya)</option>
                    <option value={15}>15 soniya</option>
                    <option value={30}>30 soniya</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
