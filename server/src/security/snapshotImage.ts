import sharp from 'sharp';

export class SnapshotImageError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function decodeSnapshot(input: unknown): Promise<Buffer> {
  if (typeof input !== 'string') throw new SnapshotImageError(400, 'JPEG yoki WebP talab qilinadi');
  const match = /^data:image\/(jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!match || match[2].length % 4 !== 0) throw new SnapshotImageError(400, 'JPEG yoki WebP base64 noto‘g‘ri');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 1048576) throw new SnapshotImageError(413, 'Rasm 1 MiB dan katta');
  try {
    const decoder = sharp(bytes, { limitInputPixels: 16_777_216, failOn: 'warning', animated: false });
    const meta = await decoder.metadata();
    if (!['jpeg', 'webp'].includes(meta.format ?? '') || meta.format !== (match[1] === 'jpg' ? 'jpeg' : match[1])) {
      throw new Error('MIME mismatch');
    }
    // Fully decode, strip metadata/trailing payload, bound dimensions and re-encode.
    const sanitized = await decoder.rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 }).toBuffer();
    if (sanitized.length > 1048576) throw new SnapshotImageError(413, 'Rasm 1 MiB dan katta');
    return sanitized;
  } catch (error) {
    if (error instanceof SnapshotImageError) throw error;
    throw new SnapshotImageError(400, 'Buzilgan JPEG yoki WebP rasm');
  }
}
