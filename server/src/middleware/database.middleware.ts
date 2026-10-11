import type { Request, Response, NextFunction } from 'express';
import { databasePool, databaseTransaction } from '../db/transactionStore';

// Do not acknowledge a mutation until PostgreSQL has committed it.
export function databaseMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!databasePool) return next();
  const originalEnd = res.end.bind(res);
  let ending: Parameters<Response['end']> | undefined;
  let complete!: () => void;
  let fail!: (error: Error) => void;
  const done = new Promise<void>((resolve, reject) => { complete = resolve; fail = reject; });
  const rejectedResponse = new Error('Handler rejected the request');
  const abort = () => fail(new Error('Request aborted'));
  const timeout = setTimeout(() => fail(new Error('Request transaction timed out')), 30_000);
  req.once('aborted', abort);
  res.end = ((...args: Parameters<Response['end']>) => { ending = args; complete(); return res; }) as Response['end'];
  void databaseTransaction(async () => {
    next(); await done;
    if (res.statusCode >= 400) throw rejectedResponse;
  }).then(() => {
    res.end = originalEnd;
    if (ending) originalEnd(...ending);
  }).catch((error) => {
    res.end = originalEnd;
    if (error === rejectedResponse && ending) { originalEnd(...ending); return; }
    if (res.headersSent) { res.destroy(); return; }
    res.removeHeader('Content-Length');
    res.removeHeader('Set-Cookie');
    res.status(503).json({ code: 'DATABASE_UNAVAILABLE', error: 'Saqlash amalga oshmadi. Qayta urinib ko‘ring.' });
  }).finally(() => {
    clearTimeout(timeout);
    req.off('aborted', abort);
  });
}
