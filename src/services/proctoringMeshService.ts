
import { AntiCheatConfig } from '../types';

export interface ProctoringFrameResult {
  hasViolation: boolean;
  violationReason?: string;
  violationType?: 'no_face' | 'multiple_faces' | 'face_covered' | 'eyes_covered' | 'face_too_small' | 'looking_away';
  faceCount: number;
  leftEAR: number;
  rightEAR: number;
  faceWidth: number;
  faceHeight: number;
  isEyesBlocked: boolean;
  landmarks?: { x: number; y: number; z?: number }[];
}

export const MESH_LANDMARKS = {
  NOSE_TIP: 1,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_OUTER: 263,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  LEFT_IRIS: 468,
  RIGHT_IRIS: 473,
};

export function getLandmarkDistance(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  if (!p1 || !p2) return 0;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

export function calculateEAR(
  top: { x: number; y: number; z?: number },
  bottom: { x: number; y: number; z?: number },
  left: { x: number; y: number; z?: number },
  right: { x: number; y: number; z?: number }
): number {
  if (!top || !bottom || !left || !right) return 0;
  const vertical = getLandmarkDistance(top, bottom);
  const horizontal = Math.max(0.0001, getLandmarkDistance(left, right));
  return vertical / horizontal;
}

export class FaceMeshProctoringEngine {
  private config: Partial<AntiCheatConfig>;
  private violationStartTime: number | null = null;
  private eyesClosedStartTime: number | null = null;
  private lookingAwayStartTime: number | null = null;
  private activeWarning: string | null = null;

  constructor(config: Partial<AntiCheatConfig> = {}) {
    this.config = config;
  }

  public updateConfig(config: Partial<AntiCheatConfig>) {
    this.config = { ...this.config, ...config };
  }

  public resetTimers() {
    this.violationStartTime = null;
    this.eyesClosedStartTime = null;
    this.lookingAwayStartTime = null;
    this.activeWarning = null;
  }

  public analyzeFrame(
    faceLandmarks: { x: number; y: number; z?: number }[][],
    timestamp: number = Date.now()
  ): ProctoringFrameResult {
    const mode = this.config?.proctoringMode || 'STRICT';

    
    if (mode === 'DISABLED' || this.config?.enabled === false) {
      this.resetTimers();
      return {
        hasViolation: false,
        faceCount: faceLandmarks?.length || 1,
        leftEAR: 0.3,
        rightEAR: 0.3,
        faceWidth: 0.3,
        faceHeight: 0.4,
        isEyesBlocked: false,
      };
    }

    const maxAbsenceDurationMs = (this.config?.maxAbsenceGracePeriod ?? (mode === 'STRICT' ? 1.5 : mode === 'STANDARD' ? 3.0 : 5.0)) * 1000;
    const minEarThreshold = 0.18;
    const minFaceSizeRatio = 0.12;
    const maxEyesClosedDurationMs = 2500; 

    const faceCount = faceLandmarks?.length || 0;

    
    if (faceCount === 0) {
      if (!this.violationStartTime) this.violationStartTime = timestamp;
      const elapsed = timestamp - this.violationStartTime;

      if (elapsed >= maxAbsenceDurationMs) {
        this.activeWarning = "Kadrda yuz aniqlanmadi yoki yuz to'liq to'silgan! Kamera oldida to'g'riga qarab o'tiring.";
        return {
          hasViolation: true,
          violationReason: this.activeWarning,
          violationType: 'no_face',
          faceCount: 0,
          leftEAR: 0,
          rightEAR: 0,
          faceWidth: 0,
          faceHeight: 0,
          isEyesBlocked: true,
        };
      }

      return {
        hasViolation: false,
        faceCount: 0,
        leftEAR: 0,
        rightEAR: 0,
        faceWidth: 0,
        faceHeight: 0,
        isEyesBlocked: true,
      };
    }

    
    this.violationStartTime = null;

    
    if (faceCount > 1) {
      this.activeWarning = "Kadrda begona shaxs aniqlandi! Imtihon faqat yolg'iz topshirilishi shart.";
      return {
        hasViolation: true,
        violationReason: this.activeWarning,
        violationType: 'multiple_faces',
        faceCount,
        leftEAR: 0.3,
        rightEAR: 0.3,
        faceWidth: 0.3,
        faceHeight: 0.4,
        isEyesBlocked: false,
      };
    }

    const lm = faceLandmarks[0];

    
    if (mode === 'RELAXED') {
      this.resetTimers();
      return {
        hasViolation: false,
        faceCount: 1,
        leftEAR: 0.3,
        rightEAR: 0.3,
        faceWidth: 0.3,
        faceHeight: 0.4,
        isEyesBlocked: false,
        landmarks: lm,
      };
    }

    
    const requiredPoints = [
      lm[MESH_LANDMARKS.NOSE_TIP],
      lm[MESH_LANDMARKS.CHIN],
      lm[MESH_LANDMARKS.FOREHEAD],
      lm[MESH_LANDMARKS.LEFT_EYE_OUTER],
      lm[MESH_LANDMARKS.RIGHT_EYE_OUTER],
    ];

    const hasAllKeyPoints = requiredPoints.every(
      (pt) => pt && typeof pt.x === 'number' && typeof pt.y === 'number'
    );

    const strictFace = this.config?.strictFaceCheck ?? (mode === 'STRICT' || mode === 'STANDARD');
    if (strictFace && !hasAllKeyPoints) {
      this.activeWarning = "Yuzingiz to'liq ko'rinmayapti. Qo'lingizni yoki to'siqni yuzingizdan oling!";
      return {
        hasViolation: true,
        violationReason: this.activeWarning,
        violationType: 'face_covered',
        faceCount: 1,
        leftEAR: 0,
        rightEAR: 0,
        faceWidth: 0,
        faceHeight: 0,
        isEyesBlocked: true,
        landmarks: lm,
      };
    }

    
    const forehead = lm[MESH_LANDMARKS.FOREHEAD];
    const chin = lm[MESH_LANDMARKS.CHIN];
    const leftEyeOuter = lm[MESH_LANDMARKS.LEFT_EYE_OUTER];
    const rightEyeOuter = lm[MESH_LANDMARKS.RIGHT_EYE_OUTER];

    const faceHeight = forehead && chin ? getLandmarkDistance(forehead, chin) : 0;
    const faceWidth = leftEyeOuter && rightEyeOuter ? getLandmarkDistance(leftEyeOuter, rightEyeOuter) : 0;

    if (faceHeight < minFaceSizeRatio || faceWidth < minFaceSizeRatio * 0.7) {
      this.activeWarning = "Kameraga yaqinroq o'tiring, butun yuz to'liq ko'rinsin.";
      return {
        hasViolation: true,
        violationReason: this.activeWarning,
        violationType: 'face_too_small',
        faceCount: 1,
        leftEAR: 0.25,
        rightEAR: 0.25,
        faceWidth,
        faceHeight,
        isEyesBlocked: false,
        landmarks: lm,
      };
    }

    
    const leftEAR = calculateEAR(
      lm[MESH_LANDMARKS.LEFT_EYE_TOP],
      lm[MESH_LANDMARKS.LEFT_EYE_BOTTOM],
      lm[MESH_LANDMARKS.LEFT_EYE_OUTER],
      lm[MESH_LANDMARKS.LEFT_EYE_INNER]
    );

    const rightEAR = calculateEAR(
      lm[MESH_LANDMARKS.RIGHT_EYE_TOP],
      lm[MESH_LANDMARKS.RIGHT_EYE_BOTTOM],
      lm[MESH_LANDMARKS.RIGHT_EYE_OUTER],
      lm[MESH_LANDMARKS.RIGHT_EYE_INNER]
    );

    const requireEyes = this.config?.requireBothEyesVisible ?? (mode === 'STRICT');
    const areEyesBlockedOrClosed = requireEyes && (leftEAR < minEarThreshold || rightEAR < minEarThreshold);

    if (areEyesBlockedOrClosed) {
      if (!this.eyesClosedStartTime) this.eyesClosedStartTime = timestamp;
      const elapsedEyes = timestamp - this.eyesClosedStartTime;

      if (elapsedEyes >= maxEyesClosedDurationMs) {
        this.activeWarning = "Ko'zlaringiz to'silgan yoki uzoq vaqt yopiq holatda! Ko'zingizni to'liq ochiq tuting.";
        return {
          hasViolation: true,
          violationReason: this.activeWarning,
          violationType: 'eyes_covered',
          faceCount: 1,
          leftEAR,
          rightEAR,
          faceWidth,
          faceHeight,
          isEyesBlocked: true,
          landmarks: lm,
        };
      }
    } else {
      this.eyesClosedStartTime = null;
    }

    
    const trackGaze = this.config?.trackGazeDirection ?? (mode === 'STRICT');
    const noseTip = lm[MESH_LANDMARKS.NOSE_TIP];
    const leftCheek = lm[MESH_LANDMARKS.LEFT_CHEEK] || leftEyeOuter;
    const rightCheek = lm[MESH_LANDMARKS.RIGHT_CHEEK] || rightEyeOuter;

    if (trackGaze && noseTip && leftCheek && rightCheek) {
      const faceSpan = Math.max(0.001, rightCheek.x - leftCheek.x);
      const relativeNose = (noseTip.x - leftCheek.x) / faceSpan;

      if (relativeNose < 0.22 || relativeNose > 0.78) {
        if (!this.lookingAwayStartTime) this.lookingAwayStartTime = timestamp;
        if (timestamp - this.lookingAwayStartTime >= 2500) {
          this.activeWarning = "Monitordan chetga qarash holati aniqlandi! Faqat ekranga qarang.";
          return {
            hasViolation: true,
            violationReason: this.activeWarning,
            violationType: 'looking_away',
            faceCount: 1,
            leftEAR,
            rightEAR,
            faceWidth,
            faceHeight,
            isEyesBlocked: false,
            landmarks: lm,
          };
        }
      } else {
        this.lookingAwayStartTime = null;
      }
    }

    
    this.resetTimers();
    return {
      hasViolation: false,
      faceCount: 1,
      leftEAR,
      rightEAR,
      faceWidth,
      faceHeight,
      isEyesBlocked: false,
      landmarks: lm,
    };
  }
}
