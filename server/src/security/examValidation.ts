import type { ExamRecord, QuestionRecord } from '../db/store';

function imageReference(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string' || value.length > 350_000) throw new Error('Savol rasmi hajmi 350 kBdan oshmasligi kerak');
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && value.length <= 2048) return value;
  } catch { /* Invalid URL is rejected below. */ }
  throw new Error('Rasm uchun HTTPS havola yoki PNG/JPEG/WebP data URL kerak; SVG/HTML qabul qilinmaydi');
}

export function validateExam(exam: ExamRecord): string | undefined {
  if (exam.kind !== undefined && !['olympiad', 'level_test', 'national_certificate'].includes(exam.kind)) return 'Test turi noto‘g‘ri';
  if (exam.practiceEnabled !== undefined && typeof exam.practiceEnabled !== 'boolean') return 'Mashq ruxsati boolean bo‘lishi kerak';
  if (exam.sourceYear !== undefined && (!Number.isInteger(exam.sourceYear) || exam.sourceYear < 1900 || exam.sourceYear > 2100)) return 'Manba yili noto‘g‘ri';
  if (exam.raschConfig && exam.kind !== 'national_certificate') return 'Rasch faqat milliy sertifikat sinovi uchun';
  if (typeof exam.title !== 'string' || exam.title.trim().length < 3 || exam.title.length > 200) return 'Imtihon nomi 3–200 belgi bo‘lishi kerak';
  if (!Number.isFinite(exam.durationMinutes) || exam.durationMinutes < 5 || exam.durationMinutes > 300) return 'Davomiylik 5–300 daqiqa bo‘lishi kerak';
  if (!Number.isFinite(exam.maxScore) || exam.maxScore <= 0) return 'Maksimal ball noto‘g‘ri';
  if (!['active', 'upcoming', 'completed', 'ochiq', 'yopiq'].includes(exam.status)) return 'Imtihon holati noto‘g‘ri';
  if (!['online', 'offline'].includes(exam.format)) return 'Imtihon formati noto‘g‘ri';
  if (typeof exam.startTime !== 'string' || typeof exam.endTime !== 'string' ||
      !Number.isFinite(Date.parse(exam.startTime)) || !Number.isFinite(Date.parse(exam.endTime)) ||
      Date.parse(exam.endTime) <= Date.parse(exam.startTime)) return 'Boshlanish va tugash sanalari noto‘g‘ri';
  if (exam.targetGrades && (!Array.isArray(exam.targetGrades) ||
      exam.targetGrades.some(g => !Number.isInteger(g) || g < 1 || g > 11))) return 'Sinflar 1–11 oralig‘ida bo‘lishi kerak';
  if (exam.isAlwaysOpen !== undefined && typeof exam.isAlwaysOpen !== 'boolean') return 'Doimiy ochiqlik belgisi noto‘g‘ri';
  return undefined;
}

export function normalizeQuestions(examId: string, input: unknown): QuestionRecord[] {
  if (!Array.isArray(input) || input.length > 200) throw new Error('Savollar ro‘yxati: ko‘pi bilan 200 ta');
  const ids = new Set<string>();
  return input.map((value: unknown, index): QuestionRecord => {
    if (!value || typeof value !== 'object') throw new Error('Savol formati noto‘g‘ri');
    const q = value as Record<string, unknown>;
    if (q.type === 'code' || q.type === 'file_upload') throw new Error('Kod va fayl javoblarini avtomatik baholash mavjud emas');
    const text = q.question_text ?? q.questionText ?? q.content ?? q.text;
    if (typeof text !== 'string' || !text.trim() || text.length > 20000) throw new Error('Savol matni bo‘sh yoki juda uzun');
    const rawId = typeof q.id === 'string' ? q.id : String(index + 1);
    const prefix = 'q_' + examId + '_';
    const id = rawId.startsWith(prefix) ? rawId : prefix + rawId;
    if (id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw new Error('Savol ID noto‘g‘ri yoki takrorlangan');
    ids.add(id);
    if (q.options !== undefined && !Array.isArray(q.options)) throw new Error('Variantlar ro‘yxati noto‘g‘ri');
    const rawOptions = (q.options ?? []) as unknown[];
    if (rawOptions.length === 1 || rawOptions.length > 26) throw new Error('Variantlar soni 2–26 ta bo‘lishi kerak');
    const optionIds = new Set<string>();
    const options = rawOptions.map((value, i) => {
      const option = typeof value === 'string' ? { id: String.fromCharCode(65 + i), text: value }
        : value as Record<string, unknown> | null;
      if (!option || typeof option.id !== 'string' || typeof option.text !== 'string' ||
          !option.text.trim() || option.text.length > 10000 || !/^[a-zA-Z0-9_-]{1,64}$/.test(option.id) ||
          optionIds.has(option.id.toUpperCase())) throw new Error('Variant ID yoki matni noto‘g‘ri');
      optionIds.add(option.id.toUpperCase());
      return { id: option.id, text: option.text, imageUrl: imageReference(option.imageUrl ??
        (Array.isArray(q.optionImages) ? q.optionImages[i] : undefined)) };
    });
    const correct = q.correct_answer ?? q.correctAnswer;
    if (typeof correct !== 'string' || !correct.trim() || correct.length > 10000) throw new Error('To‘g‘ri javob majburiy');
    const matches = options.filter(o => o.id.toUpperCase() === correct.trim().toUpperCase() ||
      o.text.trim().toUpperCase() === correct.trim().toUpperCase());
    if (options.length && matches.length !== 1) throw new Error('To‘g‘ri javob bitta variantni aniq ko‘rsatishi kerak');
    const points = Number(q.points);
    if (!Number.isFinite(points) || points <= 0 || points > 10000) throw new Error('Savol bali noto‘g‘ri');
    return { id, examId, question_text: text.trim(), options, imageUrl: imageReference(q.imageUrl),
      correct_answer: options.length ? matches[0].id : correct.trim(), points, orderNum: index + 1,
      explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 20000) : '' };
  });
}
