

export type CalibrationElement = 'hands' | 'student' | 'desk' | 'screen';

export interface AIPlacementEvaluation {
  valid_placement: boolean;
  missing_elements: CalibrationElement[];
  guidance_message: string;
  confidence?: number;
  details?: {
    student_detected: boolean;
    hands_detected: boolean;
    desk_detected: boolean;
    screen_detected: boolean;
    distance_rating: 'too_close' | 'optimal' | 'too_far';
    angle_rating?: 'too_flat' | 'optimal' | 'too_steep';
  };
  analyzed_at?: string;
}

export type SetupStep = 'pairing' | 'placement' | 'ai_calibration' | 'gatekeeper' | 'ready';

export interface DualDeviceSession {
  sessionId: string;
  token: string;
  examId: string;
  examTitle?: string;
  studentId: string;
  studentName?: string;
  status: 'WAITING_DEVICE' | 'DEVICE_CONNECTED' | 'CALIBRATING' | 'CALIBRATED' | 'START_PERMITTED';
  pairedAt?: number;
  lastPing?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  deviceInfo?: string;
  streamUrl?: string;
}

export const PROCTOR_SOCKET_EVENTS = {
  JOIN_ROOM: 'proctor:join_room',
  DEVICE_CONNECTED: 'DEVICE_CONNECTED',
  DEVICE_DISCONNECTED: 'proctor:device_disconnected',
  REQUEST_SNAPSHOT: 'proctor:request_snapshot',
  SNAPSHOT_READY: 'proctor:snapshot_ready',
  AI_CALIBRATION_REQUEST: 'proctor:ai_calibration_request',
  AI_CALIBRATION_RESULT: 'proctor:ai_calibration_result',
  START_PERMITTED: 'START_PERMITTED',
  WEBRTC_SIGNAL: 'proctor:webrtc_signal',
  FRAME_PREVIEW: 'proctor:frame_preview',
  BATTERY_STATUS: 'proctor:battery_status',
  HEARTBEAT: 'proctor:heartbeat',
} as const;
