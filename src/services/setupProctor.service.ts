import { io, type Socket } from 'socket.io-client';
import { apiClient } from './api';
import type { AIPlacementEvaluation, DualDeviceSession } from '../types/dualDeviceProctor';
import { PROCTOR_SOCKET_EVENTS } from '../types/dualDeviceProctor';

export async function validatePlacementSnapshot(
  imageBase64: string, options?: { sessionId?: string; token?: string; examId?: string; studentId?: string }
): Promise<AIPlacementEvaluation> {
  if (!options?.sessionId || !options.token) throw new Error('Server proktor sessiyasi talab qilinadi');
  const result = await apiClient.post<{ evaluation: AIPlacementEvaluation }>('/proctor/calibrate',
    { sessionId: options.sessionId, token: options.token, imageBase64 });
  return result.evaluation;
}

export class DualDeviceProctorGateway {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(data: any) => void>>();
  public connect(config: { sessionId: string; token: string; role: 'primary' | 'secondary'; serverUrl?: string }) {
    this.disconnect();
    this.socket = io(config.serverUrl || import.meta.env.VITE_WS_URL || window.location.origin, {
      auth: { sessionId: config.sessionId, token: config.token },
      transports: ['websocket'], timeout: 8000, reconnectionAttempts: 3,
    });
    for (const event of [...Object.values(PROCTOR_SOCKET_EVENTS), 'proctor:ready', 'proctor:error', 'connect_error', 'disconnect']) {
      this.socket.on(event, (data) => {
        for (const listener of this.listeners.get(event) ?? []) listener(data);
      });
    }
  }
  public on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => { this.listeners.get(event)?.delete(callback); };
  }
  public emit(event: string, payload?: unknown) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, payload);
  }
  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export async function createDualDeviceSession(examId: string, studentId: string): Promise<DualDeviceSession & { pairingCode: string }> {
  const result = await apiClient.post<{ sessionId: string; token: string; pairingCode: string }>(
    '/proctor/session/create', { examId });
  return { ...result, examId, studentId, status: 'WAITING_DEVICE' };
}
