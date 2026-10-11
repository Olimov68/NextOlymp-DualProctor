

import axios from 'axios';

export interface AIPlacementEvaluation {
  valid_placement: boolean;
  missing_elements: ('hands' | 'student' | 'desk' | 'screen' | 'ai_verification_pending')[];
  guidance_message: string;
  confidence?: number;
  details?: {
    student_detected: boolean;
    hands_detected: boolean;
    desk_detected: boolean;
    screen_detected: boolean;
    distance_rating: 'too_close' | 'optimal' | 'too_far';
    angle_rating?: 'too_flat' | 'optimal' | 'too_steep';
  };
}

export interface CalibrationOptions {
  modelProvider?: 'gemini' | 'deepseek' | 'auto';
  geminiApiKey?: string;
  deepseekApiKey?: string;
}

const VISION_SYSTEM_PROMPT = `
Siz NextOlymp onlayn imtihon tizimining Computer Vision va Proktorlik bo'yicha qat'iy AI inspektorisiz.
O'quvchi 2-telefon kamerasini stolning yon/orqa tomoniga (45 gradus burchak ostida, 1.5 metr masofada) o'rnatgan.
Sizga ushbu 2-telefon orqa kamerasidan olingan nazorat kadri (snapshot) taqdim etiladi.

KADRNI QUYIDAGI 4 TA PARAMETR BO'YICHA QAT'IY BAHOLANG:
1. "student": O'quvchining gavdasi, boshi va gavda holati to'liq yoki yetarli darajada ko'rinib turibdimi?
2. "hands": O'quvchining ikkala qo'li (klaviatura, sichqoncha yoki qalam ushlagan holatda) kadrda yaqqol ko'rinyaptimi?
3. "desk": Ish stoli yuzasi (ishchi hudud, ortiqcha buyumlar yoki yordamchi vositalar yo'qligi) ko'rinib turibdimi?
4. "screen": Asosiy test qurilmasining ekrani (noutbuk yoki planshet displeyi yon/orqa rakursdan) kadrga tushganmi?
5. Masofa bahosi: Kamera juda yaqinmi ("too_close"), optimalmi ("optimal"), yoki juda uzoqmi ("too_far")?

JAVOBNI FAQAT QUYIDAGI QAT'IY JSON FORMATIDA QAYTARING (hech qanday markdown yoki qo'shimcha matnsiz):
{
  "valid_placement": boolean,
  "missing_elements": ["hands" | "student" | "desk" | "screen"],
  "guidance_message": "O'zbek tilida o'quvchiga kamerani qanday to'g'rilash bo'yicha qisqa, aniq ko'rsatma",
  "details": {
    "student_detected": boolean,
    "hands_detected": boolean,
    "desk_detected": boolean,
    "screen_detected": boolean,
    "distance_rating": "too_close" | "optimal" | "too_far",
    "angle_rating": "too_flat" | "optimal" | "too_steep"
  }
}

Qoidalar:
- Agar 4 ta elementdan birortasi etishmasa yoki kamera masofasi noto'g'ri bo'lsa, "valid_placement" qat'iyan false bo'lishi shart!
- Faqat barcha 4 element aniq ko'ringan va masofa optimal bo'lsagina "valid_placement": true bo'ladi.
- "guidance_message" o'quvchiga amaliy yordam berishi kerak (masalan: "Kamerani biroz orqaroqqa suring, qo'llaringiz ko'rinmayapti").
`.trim();

export async function validatePlacementSnapshot(
  imageBase64: string, options: CalibrationOptions = {}
): Promise<AIPlacementEvaluation> {
  const unavailable = (): AIPlacementEvaluation => ({
    valid_placement: false, missing_elements: ['ai_verification_pending'],
    guidance_message: 'Tasdiqlangan kamera modeli sozlanmagan yoki tekshiruv bajarilmadi. Admin bilan bog‘laning.',
  });
  const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_VISION_MODEL;
  if (!apiKey || !model || !/^[a-zA-Z0-9._-]+$/.test(model)) return unavailable();
  try {
    const { decodeSnapshot } = await import('../security/snapshotImage');
    const image = await decodeSnapshot(imageBase64);
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { contents: [{ role: 'user', parts: [{ text: VISION_SYSTEM_PROMPT },
        { inline_data: { mime_type: 'image/jpeg', data: image.toString('base64') } }] }],
        generationConfig: { temperature: 0.1, response_mime_type: 'application/json' } },
      { timeout: 8000, maxContentLength: 65536, headers: { 'x-goog-api-key': apiKey } },
    );
    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== 'string') return unavailable();
    const parsed = JSON.parse(raw);
    const details = parsed.details;
    if (typeof parsed.valid_placement !== 'boolean' || !details ||
        !['student_detected', 'hands_detected', 'desk_detected', 'screen_detected'].every(key => typeof details[key] === 'boolean') ||
        !['too_close', 'optimal', 'too_far'].includes(details.distance_rating)) return unavailable();
    const elements = ['hands', 'student', 'desk', 'screen'] as const;
    const missing = elements.filter(element => details[element + '_detected'] !== true);
    return {
      valid_placement: parsed.valid_placement === true && missing.length === 0 && details.distance_rating === 'optimal',
      missing_elements: missing,
      guidance_message: typeof parsed.guidance_message === 'string' ? parsed.guidance_message.slice(0, 500) : 'Kamerani tekshiring.',
      details,
    };
  } catch {
    // Never log request headers, provider bodies, tokens, or biometric images.
    console.error('[proctor] Vision verification unavailable');
    return unavailable();
  }
}
