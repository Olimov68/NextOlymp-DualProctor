import path from 'node:path';
import { unlink, readdir, lstat } from 'node:fs/promises';
import { dbStore } from '../db/store';
import { databaseTransaction } from '../db/transactionStore';

export const snapshotDirectory = () => path.resolve(process.env.SNAPSHOT_DIR || 'server/data/snapshots');
export function safeSnapshotPath(file: string): string {
  const root = snapshotDirectory();
  const target = path.resolve(root, file);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.includes(path.sep))
    throw new Error('Snapshot path escapes storage directory');
  return target;
}
export async function sweepSnapshots(now = Date.now()): Promise<number> {
  return databaseTransaction(async () => {
    const days = Number(process.env.SNAPSHOT_RETENTION_DAYS ?? 30);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Invalid snapshot retention');
    let removed = 0;
    for (const exam of dbStore.getExams()) {
      const snapshots = dbStore.getExamSnapshots(exam.id).sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      for (let i = 0; i < snapshots.length; i++) {
        const record = snapshots[i];
        if (i < 100 && Date.parse(record.createdAt) > now - days * 86400_000) continue;
        try { await unlink(safeSnapshotPath(record.filePath)); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
        dbStore.deleteSnapshot(record.id);
        removed++;
      }
    }
    // Rollbacks/crashes can leave unreferenced files. Only our own old regular files qualify.
    const referenced = new Set(dbStore.getExams().flatMap(exam =>
      dbStore.getExamSnapshots(exam.id).map(record => safeSnapshotPath(record.filePath))));
    const entries = await readdir(snapshotDirectory(), { withFileTypes: true }).catch(error => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    });
    for (const entry of entries) {
      if (!entry.isFile() || !/^snap_[a-f0-9-]{36}\.jpg$/i.test(entry.name)) continue;
      const file = safeSnapshotPath(entry.name);
      if (referenced.has(file)) continue;
      const stat = await lstat(file);
      if (!stat.isSymbolicLink() && stat.mtimeMs < now - 86400_000) { await unlink(file); removed++; }
    }
    return removed;
  });
}
