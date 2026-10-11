import assert from 'node:assert/strict';
import { io as connect, type Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app, server, io } from '../server';
import { dbStore } from '../db/store';
import { JWT_SECRET } from '../config/constants';

const sockets: Socket[] = [];
function event(socket: Socket, name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off(name, done); reject(new Error('Timeout: ' + name)); }, 7000);
    function done(value: unknown) { clearTimeout(timeout); resolve(value); }
    socket.once(name, done);
  });
}
async function main() {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test port');
  const port = address.port;
  const origin = { Origin: 'http://localhost:5173' };
  const exam = dbStore.getExamById('IBN-MATH-102')!;
  dbStore.saveExam({ ...exam, isAlwaysOpen: true });
  const cookie = 'token=' + jwt.sign({ id: 'usr-student-01' }, JWT_SECRET, { expiresIn: '1h' });
  const created = await request(app).post('/api/proctor/session/create').set(origin).set('Cookie', cookie).send({ examId: exam.id });
  assert.equal(created.status, 201);
  const { sessionId, token, pairingCode } = created.body;
  const paired = await request(app).post('/api/proctor/session/pair').set(origin).send({ sessionId, pairingCode });
  assert.equal(paired.status, 200);
  function socket(auth: Record<string, unknown>) {
    const value = connect('http://127.0.0.1:' + port, { auth, autoConnect: false,
      reconnection: false, transports: ['websocket'], extraHeaders: origin });
    sockets.push(value); return value;
  }
  const primary = socket({ sessionId, token });
  const ready = event(primary, 'proctor:ready'); primary.connect(); await ready;
  const secondary = socket({ sessionId, token: paired.body.token, role: 'primary' });
  const secondaryReady = event(secondary, 'proctor:ready'); secondary.connect();
  assert.equal((await secondaryReady as { role: string }).role, 'secondary');
  console.log('PASS Socket.IO: signed device role overrides forged handshake role');

  const duplicate = socket({ sessionId, token });
  const denied = event(duplicate, 'connect_error'); duplicate.connect(); await denied;
  assert.equal(duplicate.connected, false);
  console.log('PASS Socket.IO: duplicate primary connection rejected');

  const invalid = socket({ sessionId, token: jwt.sign({ sessionId }, 'not-the-server-secret') });
  const invalidEvent = event(invalid, 'connect_error'); invalid.connect(); await invalidEvent;
  assert.equal(invalid.connected, false);
  console.log('PASS Socket.IO: invalid signature rejected');

  const disconnect = event(secondary, 'disconnect');
  await request(app).post('/api/auth/logout').set(origin).set('Cookie', cookie).send({});
  await disconnect;
  assert.equal(secondary.connected, false);
  console.log('PASS Socket.IO: logout revokes connected secondary device');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  sockets.forEach(socket => socket.disconnect());
  await new Promise<void>(resolve => io.close(() => resolve()));
  if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
});
