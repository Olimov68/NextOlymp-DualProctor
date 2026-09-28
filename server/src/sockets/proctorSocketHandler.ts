

import { Server, Socket } from 'socket.io';
import { activeSessions } from '../controllers/proctor.controller';
import { validatePlacementSnapshot } from '../services/setupProctor.service';

export function setupProctorSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    const { sessionId, role, token } = socket.handshake.query as {
      sessionId?: string;
      role?: 'primary' | 'secondary';
      token?: string;
    };

    if (sessionId) {
      const room = `session_${sessionId}`;
      socket.join(room);

      
      if (role === 'secondary') {
        const session = activeSessions.get(sessionId);
        if (session) {
          session.status = 'DEVICE_CONNECTED';
        }

        
        socket.to(room).emit('DEVICE_CONNECTED', {
          sessionId,
          role: 'secondary',
          connectedAt: Date.now(),
          message: "Ikkinchi qurilma (mobil telefon) ulandi!",
        });
      }

      
      socket.on('proctor:join_room', (data) => {
        socket.join(`session_${data.sessionId}`);
      });

      
      socket.on('proctor:request_snapshot', () => {
        socket.to(room).emit('proctor:request_snapshot');
      });

      
      socket.on('proctor:snapshot_ready', async (data: { imageBase64: string }) => {
        
        socket.to(room).emit('proctor:snapshot_received');

        
        const evaluation = await validatePlacementSnapshot(data.imageBase64);

        const session = activeSessions.get(sessionId);
        if (session) {
          session.calibrated = evaluation.valid_placement;
          session.status = evaluation.valid_placement ? 'CALIBRATED' : 'DEVICE_CONNECTED';
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
          const session = activeSessions.get(sessionId);
          if (session) {
            session.status = 'WAITING_DEVICE';
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

  
  setInterval(() => {
    const now = Date.now();
    activeSessions.forEach((session, sId) => {
      if (session.calibrated && session.status !== 'START_PERMITTED' && now >= session.examStartTime) {
        session.status = 'START_PERMITTED';
        io.to(`session_${sId}`).emit('START_PERMITTED', {
          sessionId: sId,
          permittedAt: now,
          message: "Imtihon boshlandi! Ruxsat berildi.",
        });
      }
    });
  }, 3000);
}
