import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { activeProctorSessions } from '../controllers/proctor.controller';
import { validatePlacementSnapshot } from '../services/setupProctor.service';
import { JWT_SECRET } from '../config/constants';
import { dbStore } from '../db/store';

export function setupProctorSockets(io: Server) {
  // CRITICAL SECURITY FIX (Item 3): Strictly authenticate socket connections
  io.use((socket: Socket, next) => {
    const { sessionId, token, role } = socket.handshake.query as {
      sessionId?: string;
      token?: string;
      role?: 'primary' | 'secondary';
    };

    if (!sessionId || !token) {
      return next(new Error('Autentifikatsiya talab qilinadi: sessionId va token majburiy'));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (err: any) {
      return next(new Error('Yaroqsiz yoki muddati o\'tgan proctor tokeni'));
    }

    const session = activeProctorSessions.get(sessionId);
    if (!session) {
      return next(new Error('Faol proctor sessiyasi topilmadi yoki sessiya muddati yakunlangan'));
    }

    if (decoded.sessionId !== sessionId) {
      return next(new Error('Token va sessiya ID mos kelmadi'));
    }

    if (decoded.studentId && session.studentId && decoded.studentId !== session.studentId) {
      return next(new Error('Token va sessiya ishtirokchisi mos kelmadi'));
    }

    if (decoded.examId && session.examId && decoded.examId !== session.examId) {
      return next(new Error('Token va imtihon mos kelmadi'));
    }

    // Attach verified session state to socket
    socket.data = {
      sessionId,
      studentId: decoded.studentId,
      examId: decoded.examId,
      role: role || 'primary',
      authenticated: true,
    };

    next();
  });

  io.on('connection', (socket: Socket) => {
    const { sessionId, role } = socket.data as {
      sessionId: string;
      role?: 'primary' | 'secondary';
    };

    if (sessionId) {
      const room = `session_${sessionId}`;
      socket.join(room);

      if (role === 'secondary') {
        const session = activeProctorSessions.get(sessionId);
        if (session) {
          session.status = 'DEVICE_CONNECTED';
          session.lastHeartbeat = Date.now();
          dbStore.saveProctorSession(session);
        }

        socket.to(room).emit('DEVICE_CONNECTED', {
          sessionId,
          role: 'secondary',
          connectedAt: Date.now(),
          message: "Ikkinchi qurilma (mobil telefon) muvaffaqiyatli ulandi!",
        });
      }

      socket.on('proctor:join_room', (data) => {
        if (data?.sessionId === sessionId) {
          socket.join(`session_${data.sessionId}`);
        }
      });

      socket.on('proctor:request_snapshot', () => {
        socket.to(room).emit('proctor:request_snapshot');
      });

      socket.on('proctor:snapshot_ready', async (data: { imageBase64: string }) => {
        socket.to(room).emit('proctor:snapshot_received');

        const evaluation = await validatePlacementSnapshot(data.imageBase64);

        const session = activeProctorSessions.get(sessionId);
        if (session) {
          session.calibrated = evaluation.valid_placement;
          session.status = evaluation.valid_placement ? 'CALIBRATED' : 'DEVICE_CONNECTED';
          session.lastHeartbeat = Date.now();
          dbStore.saveProctorSession(session);
        }

        io.to(room).emit('proctor:ai_calibration_result', evaluation);

        if (evaluation.valid_placement && session) {
          const now = Date.now();
          if (now >= session.examStartTime) {
            io.to(room).emit('START_PERMITTED', {
              sessionId,
              permittedAt: now,
              message: "Imtihon boshlandi! Ruxsat berildi.",
            });
          }
        }
      });

      socket.on('proctor:webrtc_signal', (signalData) => {
        socket.to(room).emit('proctor:webrtc_signal', signalData);
      });

      socket.on('proctor:battery_status', (batteryData) => {
        socket.to(room).emit('proctor:battery_status', batteryData);
      });

      socket.on('disconnect', () => {
        if (role === 'secondary') {
          const session = activeProctorSessions.get(sessionId);
          if (session) {
            session.status = 'WAITING_DEVICE';
            dbStore.saveProctorSession(session);
          }
          socket.to(room).emit('proctor:device_disconnected', {
            sessionId,
            role: 'secondary',
            disconnectedAt: Date.now(),
            message: "Ikkinchi qurilma bilan aloqa uzildi!",
          });
        }
      });
    }
  });

  // Background timer to check exam start permissions
  setInterval(() => {
    const now = Date.now();
    activeProctorSessions.forEach((session, sId) => {
      if (session.calibrated && session.status !== 'START_PERMITTED' && now >= session.examStartTime) {
        session.status = 'START_PERMITTED';
        dbStore.saveProctorSession(session);
        io.to(`session_${sId}`).emit('START_PERMITTED', {
          sessionId: sId,
          permittedAt: now,
          message: "Imtihon vaqti yetib keldi. Testni boshlashga ruxsat berildi.",
        });
      }

      // Cleanup stale sessions older than 6 hours
      if (now - session.lastHeartbeat > 6 * 3600 * 1000) {
        activeProctorSessions.delete(sId);
      }
    });
  }, 3000);
}
