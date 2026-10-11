import type { AntiCheatConfig } from '../db/store';
const flags: Record<string, keyof AntiCheatConfig> = {
  TAB_SWITCH: 'blockTabSwitch', TAB_HIDDEN: 'blockTabSwitch', WINDOW_BLUR: 'blockTabSwitch',
  CLIPBOARD_ACTION: 'blockCopyPaste', COPY_PASTE: 'blockCopyPaste', CONTEXT_MENU: 'blockCopyPaste',
  COPY: 'blockCopyPaste', CUT: 'blockCopyPaste', PASTE: 'blockCopyPaste', PRINT_ATTEMPT: 'blockCopyPaste',
  FULLSCREEN_EXIT: 'requireFullscreen', EXIT_FULLSCREEN: 'requireFullscreen',
  DEVTOOLS_KEY: 'blockDevTools', DEVTOOLS_OPENED: 'blockDevTools', DEVTOOLS_DETECTED: 'blockDevTools', VIEW_SOURCE: 'blockDevTools',
  NO_FACE: 'requireWebcam', MULTI_FACE: 'requireWebcam', MULTIPLE_FACES: 'requireWebcam',
  EYES_COVERED: 'requireBothEyesVisible', LANDMARKS_MISSING: 'strictFaceCheck', GAZE_AWAY: 'trackGazeDirection',
  UNKNOWN_SPEAKER: 'detectUnknownSpeakers', UNKNOWN_SPEAKER_VOICE: 'detectUnknownSpeakers',
  MULTIPLE_SPEAKERS: 'detectMultipleSpeakers', SUSPICIOUS_NOISE: 'requireVoiceBiometrics',
};
const aiTypes = new Set(['NO_FACE','MULTI_FACE','MULTIPLE_FACES','EYES_COVERED','LANDMARKS_MISSING','GAZE_AWAY',
  'UNKNOWN_SPEAKER','UNKNOWN_SPEAKER_VOICE','MULTIPLE_SPEAKERS','SUSPICIOUS_NOISE']);
export function knownEvent(type: string): boolean { return Object.hasOwn(flags, type); }
export function eventEnabled(config: AntiCheatConfig, type: string): boolean {
  if (['UNKNOWN_SPEAKER', 'UNKNOWN_SPEAKER_VOICE', 'MULTIPLE_SPEAKERS', 'SUSPICIOUS_NOISE'].includes(type)) return false;
  if (!config.enabled || !knownEvent(type)) return false;
  if (aiTypes.has(type) && config.proctoringMode === 'DISABLED') return false;
  return config[flags[type]] === true;
}
