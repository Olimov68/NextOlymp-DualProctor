export class SnapshotImageError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let sharpModule: any = null;
let sharpChecked = false;

async function getSharp(): Promise<any> {
  if (sharpChecked) return sharpModule;
  sharpChecked = true;
  try {
    const mod = await import('sharp');
    sharpModule = (mod as any).default || mod;
  } catch {
    console.warn('[snapshotImage] sharp moduli yuklanmadi (CPU SIMD qo‘llab-quvvatlanmaydi). Xavfsiz bufer tekshiruvi ishlatiladi.');
    sharpModule = null;
  }
  return sharpModule;
}

export async function decodeSnapshot(input: unknown): Promise<Buffer> {
  if (typeof input !== 'string') throw new SnapshotImageError(400, 'JPEG yoki WebP talab qilinadi');
  const match = /^data:image\/(jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input);
  if (!match || match[2].length % 4 !== 0) throw new SnapshotImageError(400, 'JPEG yoki WebP base64 noto‘g‘ri');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 1048576) throw new SnapshotImageError(413, 'Rasm 1 MiB dan katta');

  const sharp = await getSharp();
  if (sharp) {
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

  // Pure Node.js fallback when sharp native binary is incompatible with host CPU
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';

  const requestedFormat = match[1] === 'jpg' ? 'jpeg' : match[1];
  if (requestedFormat === 'jpeg' && !isJpeg) throw new SnapshotImageError(400, 'Buzilgan JPEG rasm');
  if (requestedFormat === 'webp' && !isWebp) throw new SnapshotImageError(400, 'Buzilgan WebP rasm');
  if (!isJpeg && !isWebp) throw new SnapshotImageError(400, 'Faqat haqiqiy JPEG yoki WebP rasm qabul qilinadi');

  return bytes;
}
