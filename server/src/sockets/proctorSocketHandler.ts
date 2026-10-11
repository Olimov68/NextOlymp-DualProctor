import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { dbStore } from '../db/store';
import { databaseTransaction } from '../db/transactionStore';
import { validatePlacementSnapshot } from '../services/setupProctor.service';
import { JWT_SECRET } from '../config/constants';

export function setupProctorSockets(io: Server) {
  // This deployment supports one Socket.IO worker; a shared adapter/lease is required for clustering.
  const liveSockets = new Set<string>();
  io.use((socket, next) => {
    liveSockets.add(socket.id);
    void databaseTransaction(async () => {
      const { sessionId, token } = socket.handshake.auth ?? {};
      if (typeof sessionId !== 'string' || typeof token !== 'string') throw new Error('Credentials required');
      const claims = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const session = dbStore.getProctorSession(sessionId);
      if (!session || session.examEndTime <= Date.now() || claims.sessionId !== sessionId ||
          claims.examId !== session.examId || claims.studentId !== session.studentId ||
          !['primary', 'secondary'].includes(claims.deviceRole) ||
          claims.jti !== (claims.deviceRole === 'primary' ? session.primaryJti : session.secondaryJti)) {
        throw new Error('Invalid proctor session');
      }
      const student = dbStore.getUserById(session.studentId);
      if (student?.status !== 'active' || (student.authVersion ?? 0) !== (session.authVersion ?? 0)) throw new Error('Inactive account');
      const connectionKey = claims.deviceRole === 'primary' ? 'primarySocketId' : 'secondarySocketId';
      if (session[connectionKey] && liveSockets.has(session[connectionKey]!)) throw new Error('Device already connected');
      session[connectionKey] = socket.id;
      session.lastHeartbeat = Date.now();
      dbStore.saveProctorSession(session);
      socket.data = { sessionId, role: claims.deviceRole, expiresAt: session.examEndTime };
    }).then(() => next()).catch(() => { liveSockets.delete(socket.id); next(new Error('Proktor sessiyasi yaroqsiz yoki band')); });
  });

  io.on('connection', (socket: Socket) => {
    const { sessionId, role, expiresAt } = socket.data;
    const room = 'session_' + sessionId;
    socket.join(room);
    socket.emit('proctor:ready', { sessionId, role });
    if (role === 'secondary') socket.to(room).emit('DEVICE_CONNECTED', { sessionId, role });
    const expiry = setTimeout(() => socket.disconnect(true), Math.max(1, expiresAt - Date.now()));
    expiry.unref();
    const revokeCheck = setInterval(() => {
      void databaseTransaction(async () => {
        const session = dbStore.getProctorSession(sessionId);
        const student = session && dbStore.getUserById(session.studentId);
        return Boolean(session && student?.status === 'active' &&
          (student.authVersion ?? 0) === (session.authVersion ?? 0));
      }).then(valid => { if (!valid) socket.disconnect(true); }).catch(() => socket.disconnect(true));
    }, 5000);
    revokeCheck.unref();
    let lastFrame = 0;
    let lastCalibration = 0;
    let evaluating = false;
    let packetWindow = Date.now();
    let packets = 0;
    socket.use((_packet, next) => {
      if (Date.now() - packetWindow > 1000) { packetWindow = Date.now(); packets = 0; }
      if (++packets > 30 || Date.now() >= expiresAt) return next(new Error('Packet limit'));
      next();
    });
    socket.on('proctor:request_snapshot', () => {
      if (role === 'primary') socket.to(room).emit('proctor:request_snapshot');
    });
    socket.on('proctor:snapshot_ready', async (data) => {
      if (role !== 'secondary' || evaluating || Date.now() - lastCalibration < 5000 ||
          typeof data?.imageBase64 !== 'string' || data.imageBase64.length > 1_400_000) return;
      evaluating = true;
      lastCalibration = Date.now();
      try {
        const evaluation = await validatePlacementSnapshot(data.imageBase64);
        const permitted = await databaseTransaction(async () => {
          const session = dbStore.getProctorSession(sessionId);
          if (!session || session.secondarySocketId !== socket.id || session.examEndTime <= Date.now()) return;
          session.calibrated = evaluation.valid_placement === true;
          session.status = session.calibrated ? 'CALIBRATED' : 'DEVICE_CONNECTED';
          session.lastHeartbeat = Date.now();
          dbStore.saveProctorSession(session);
          return session.calibrated && Date.now() >= session.examStartTime;
        });
        // Notify clients only after the database commit succeeded.
        io.to(room).emit('proctor:ai_calibration_result', evaluation);
        if (permitted) io.to(room).emit('START_PERMITTED', { sessionId });
      } catch { socket.emit('proctor:error', { message: 'Kamera tekshiruvi bajarilmadi. Qayta urinib ko‘ring.' }); }
      finally { evaluating = false; }
    });
    socket.on('proctor:frame_preview', (data) => {
      if (role !== 'secondary' || Date.now() - lastFrame < 1000 ||
          typeof data?.frame !== 'string' || data.frame.length > 400_000) return;
      lastFrame = Date.now();
      socket.to(room).emit('proctor:frame_preview', { frame: data.frame });
    });
    socket.on('proctor:webrtc_signal', (data) => {
      if (JSON.stringify(data ?? {}).length < 65536) socket.to(room).emit('proctor:webrtc_signal', data);
    });
    socket.on('proctor:battery_status', (data) => {
      if (role === 'secondary' && typeof data?.level === 'number' && data.level >= 0 && data.level <= 1)
        socket.to(room).emit('proctor:battery_status', { level: data.level, charging: data.charging === true });
    });
    socket.on('disconnect', () => {
      liveSockets.delete(socket.id);
      clearTimeout(expiry);
      clearInterval(revokeCheck);
      void databaseTransaction(async () => {
        const session = dbStore.getProctorSession(sessionId);
        if (!session) return;
        const key = role === 'primary' ? 'primarySocketId' : 'secondarySocketId';
        if (session[key] !== socket.id) return;
        delete session[key];
        if (role === 'secondary') { session.calibrated = false; session.status = 'WAITING_DEVICE'; }
        dbStore.saveProctorSession(session);
      }).catch(() => console.error('[proctor] Disconnect state update failed'));
      if (role === 'secondary') socket.to(room).emit('proctor:device_disconnected', { sessionId, role });
    });
  });
}
