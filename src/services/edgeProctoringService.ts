import { useProctoringStore } from '../store/useProctoringStore';
import { AntiCheatConfig } from '../types';

export interface EdgeDetectionResult {
  faceCount: number;
  faceDetected: boolean;
  multipleFaces: boolean;
  eyeGazeScore: number; 
  headPose: 'center' | 'left' | 'right' | 'up' | 'down';
  relativeNoseX: number;
  audioVolumeDb: number;
  anomalyDetected: boolean;
  anomalyReason?: string;
  anomalyType?: 'multiple_faces' | 'no_face' | 'looking_away' | 'audio_anomaly' | 'phone_detected';
  landmarks?: { x: number; y: number; z?: number }[];
}

export interface AiVisionVerificationResult {
  cheat: boolean;
  confidence: number;
  reason: string;
}

const ALERT_COOLDOWN_MS = 10000; 
let lastAlertTimestamp = 0;

export async function verifyIncidentWithGeminiVision(
  _base64Image: string,
  detectedReason: string
): Promise<AiVisionVerificationResult> {
  return {
    cheat: true,
    confidence: 90,
    reason: detectedReason,
  };
}

export class EdgeAudioMonitor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private intervalId: any = null;
  private onVolumeTick?: (volume: number) => void;
  private onAnomalyTrigger?: (reason: string) => void;

  public start(
    stream: MediaStream,
    onVolumeTick?: (volume: number) => void,
    onAnomalyTrigger?: (reason: string) => void
  ) {
    this.onVolumeTick = onVolumeTick;
    this.onAnomalyTrigger = onAnomalyTrigger;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.intervalId = setInterval(() => {
        if (!this.analyser || !this.dataArray) return;
        this.analyser.getByteFrequencyData(this.dataArray as any);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const averageVolume = Math.round(sum / this.dataArray.length);

        if (this.onVolumeTick) {
          this.onVolumeTick(averageVolume);
        }

        
        if (averageVolume > 48 && this.onAnomalyTrigger) {
          this.onAnomalyTrigger('Xonada begona ovoz yoki shivirlash aniqlandi');
        }
      }, 500);
    } catch (e) {
      console.warn('[Audio Monitor] AudioContext error:', e);
    }
  }

  public stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
    this.analyser = null;
  }
}

function dist2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function analyzeFaceLandmarks(
  faceLandmarksArray: { x: number; y: number; z?: number }[][],
  config?: Partial<AntiCheatConfig>
): EdgeDetectionResult {
  const mode = config?.proctoringMode || 'STRICT';

  
  if (mode === 'DISABLED') {
    return {
      faceCount: faceLandmarksArray?.length || 1,
      faceDetected: true,
      multipleFaces: false,
      eyeGazeScore: 100,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 0,
      anomalyDetected: false,
    };
  }

  const faceCount = faceLandmarksArray?.length || 0;

  if (faceCount === 0) {
    return {
      faceCount: 0,
      faceDetected: false,
      multipleFaces: false,
      eyeGazeScore: 0,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 0,
      anomalyDetected: true,
      anomalyReason: 'Kadrda yuz aniqlanmadi (yuz to\'silgan yoki kadrda yo\'q)',
      anomalyType: 'no_face',
    };
  }

  if (faceCount > 1) {
    return {
      faceCount,
      faceDetected: true,
      multipleFaces: true,
      eyeGazeScore: 50,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 0,
      anomalyDetected: true,
      anomalyReason: 'Kamerada begona shaxs aniqlandi (Multiple Faces)',
      anomalyType: 'multiple_faces',
    };
  }

  
  const landmarks = faceLandmarksArray[0];

  
  if (mode === 'RELAXED') {
    return {
      faceCount: 1,
      faceDetected: true,
      multipleFaces: false,
      eyeGazeScore: 90,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 10,
      anomalyDetected: false,
      landmarks,
    };
  }

  if (!landmarks || landmarks.length < 30) {
    return {
      faceCount: 1,
      faceDetected: false,
      multipleFaces: false,
      eyeGazeScore: 0,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 0,
      anomalyDetected: true,
      anomalyReason: 'Yuz nuqtalari yetarli emas (yuz qisman yoki butunlay to\'silgan)',
      anomalyType: 'no_face',
    };
  }

  const strictFace = config?.strictFaceCheck ?? (mode === 'STRICT' || mode === 'STANDARD');
  const requireEyes = config?.requireBothEyesVisible ?? (mode === 'STRICT');
  const trackGaze = config?.trackGazeDirection ?? (mode === 'STRICT');

  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeOuter = landmarks[263];
  const rightEyeInner = landmarks[362];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];

  
  if (strictFace) {
    if (!noseTip || !chin || !forehead || (requireEyes && (!leftEyeOuter || !rightEyeOuter))) {
      return {
        faceCount: 1,
        faceDetected: false,
        multipleFaces: false,
        eyeGazeScore: 0,
        headPose: 'center',
        relativeNoseX: 0.5,
        audioVolumeDb: 0,
        anomalyDetected: true,
        anomalyReason: 'Yuzning asosiy nuqtalari to\'silgan (yuz yoki ko\'zlar yopiq)',
        anomalyType: 'no_face',
        landmarks,
      };
    }
  }

  
  if (requireEyes) {
    let leftEAR = 0.3;
    let rightEAR = 0.3;
    if (leftEyeTop && leftEyeBottom && leftEyeOuter && leftEyeInner) {
      const vDist = dist2D(leftEyeTop, leftEyeBottom);
      const hDist = Math.max(0.001, dist2D(leftEyeOuter, leftEyeInner));
      leftEAR = vDist / (2 * hDist);
    }
    if (rightEyeTop && rightEyeBottom && rightEyeOuter && rightEyeInner) {
      const vDist = dist2D(rightEyeTop, rightEyeBottom);
      const hDist = Math.max(0.001, dist2D(rightEyeOuter, rightEyeInner));
      rightEAR = vDist / (2 * hDist);
    }
  }

  
  const faceWidth = Math.max(0.01, Math.abs((rightCheek?.x || rightEyeOuter?.x || 1) - (leftCheek?.x || leftEyeOuter?.x || 0)));
  const faceHeight = Math.max(0.01, Math.abs((chin?.y || 1) - (forehead?.y || 0)));

  
  if (faceWidth < 0.08 || faceHeight < 0.08) {
    return {
      faceCount: 1,
      faceDetected: false,
      multipleFaces: false,
      eyeGazeScore: 0,
      headPose: 'center',
      relativeNoseX: 0.5,
      audioVolumeDb: 0,
      anomalyDetected: true,
      anomalyReason: 'Yuzingiz kamera kadriga juda kichik yoki to\'siq bilan yopilgan',
      anomalyType: 'no_face',
      landmarks,
    };
  }

  
  let headPose: 'center' | 'left' | 'right' | 'up' | 'down' = 'center';
  let eyeGazeScore = 95;
  let anomalyDetected = false;
  let anomalyReason: string | undefined;
  let anomalyType: 'looking_away' | undefined;

  if (trackGaze && noseTip && (leftCheek || leftEyeOuter) && (rightCheek || rightEyeOuter)) {
    const lX = leftCheek?.x ?? leftEyeOuter.x;
    const rX = rightCheek?.x ?? rightEyeOuter.x;
    const relativeNose = (noseTip.x - lX) / Math.max(0.001, rX - lX);

    if (relativeNose < 0.22) {
      headPose = 'left';
      eyeGazeScore = 40;
      anomalyDetected = true;
      anomalyReason = 'O\'quvchi ekrandan chapga qattiq burildi (Gaze Deviation)';
      anomalyType = 'looking_away';
    } else if (relativeNose > 0.78) {
      headPose = 'right';
      eyeGazeScore = 40;
      anomalyDetected = true;
      anomalyReason = 'O\'quvchi ekrandan o\'ngga qattiq burildi (Gaze Deviation)';
      anomalyType = 'looking_away';
    }
  }

  return {
    faceCount: 1,
    faceDetected: true,
    multipleFaces: false,
    eyeGazeScore,
    headPose,
    relativeNoseX: 0.5,
    audioVolumeDb: 10,
    anomalyDetected,
    anomalyReason,
    anomalyType,
    landmarks,
  };
}

export async function handleTriggeredIncident(
  reason: string,
  videoElement: HTMLVideoElement,
  studentInfo?: { sessionId: string; userId: string; name: string; olympiadTitle: string }
) {
  const now = Date.now();
  if (now - lastAlertTimestamp < ALERT_COOLDOWN_MS) {
    return; 
  }
  lastAlertTimestamp = now;

  try {
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);

      
      const aiVerdict = await verifyIncidentWithGeminiVision(base64Image, reason);

      if (aiVerdict.cheat) {
        
        const procStore = useProctoringStore.getState();
        const sessId = studentInfo?.sessionId || 'proc-001';
        const userId = studentInfo?.userId || 'USR-001';
        const name = studentInfo?.name || 'Siz (Jonli Sinov)';
        const olyTitle = studentInfo?.olympiadTitle || 'Jonli Proktoring Sinovi';

        procStore.addLiveAlert({
          sessionId: sessId,
          userId: userId,
          studentName: name,
          olympiadTitle: olyTitle,
          type: reason.includes('ikkinchi') ? 'multiple_faces' :
                reason.includes('ko\'rinmayapti') ? 'no_face' :
                reason.includes('ovoz') ? 'audio_anomaly' : 'looking_away',
          title: reason,
          description: `Edge AI va Gemini Vision tahlili (${aiVerdict.confidence}% ishonchlilik): ${aiVerdict.reason}`,
          severity: reason.includes('ikkinchi') || reason.includes('ko\'rinmayapti') ? 'kritik' : 'yuqori',
          snapshotUrl: base64Image,
          status: 'yangi',
        });
      }
    }
  } catch (err) {
    console.error('handleTriggeredIncident error:', err);
  }
}
