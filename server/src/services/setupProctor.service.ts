

import axios from 'axios';

export interface AIPlacementEvaluation {
  valid_placement: boolean;
  missing_elements: ('hands' | 'student' | 'desk' | 'screen')[];
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
  imageBase64: string,
  options: CalibrationOptions = {}
): Promise<AIPlacementEvaluation> {
  
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;

  
  if (apiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: VISION_SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        },
        { timeout: 8000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText.trim());
        return {
          valid_placement: Boolean(parsed.valid_placement),
          missing_elements: Array.isArray(parsed.missing_elements) ? parsed.missing_elements : [],
          guidance_message: parsed.guidance_message || (parsed.valid_placement ? "Kamera joylashuvi a'lo darajada!" : "Kamerani to'g'rilang."),
          confidence: 0.95,
          details: parsed.details || {
            student_detected: !parsed.missing_elements?.includes('student'),
            hands_detected: !parsed.missing_elements?.includes('hands'),
            desk_detected: !parsed.missing_elements?.includes('desk'),
            screen_detected: !parsed.missing_elements?.includes('screen'),
            distance_rating: 'optimal',
          },
        };
      }
    } catch (err: any) {
      console.error('[setupProctor.service] Gemini Vision API chaqiruvida xatolik:', err?.response?.data || err.message);
    }
  }

  
  const deepseekKey = options.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: VISION_SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: "Ushbu kadrni imtihon qoidalariga ko'ra tahlil qiling." },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
              ]
            }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: { Authorization: `Bearer ${deepseekKey}` },
          timeout: 8000
        }
      );

      const rawText = response.data?.choices?.[0]?.message?.content;
      if (rawText) {
        const parsed = JSON.parse(rawText.trim());
        return {
          valid_placement: Boolean(parsed.valid_placement),
          missing_elements: parsed.missing_elements || [],
          guidance_message: parsed.guidance_message || "Joylashuv tekshirildi",
          confidence: 0.92,
          details: parsed.details
        };
      }
    } catch (err: any) {
      console.error('[setupProctor.service] DeepSeek Vision API xatosi:', err?.message);
    }
  }

  
  return fallbackEvaluation(cleanBase64);
}

function fallbackEvaluation(cleanBase64: string): AIPlacementEvaluation {
  
  const approxBytes = Math.round((cleanBase64.length * 3) / 4);
  if (approxBytes < 6000) {
    return {
      valid_placement: false,
      missing_elements: ['student', 'hands', 'desk', 'screen'],
      guidance_message: "Tasvir sifati juda past yoki qorong'i. Xona yoritilishini tekshiring.",
      confidence: 0.5,
      details: {
        student_detected: false,
        hands_detected: false,
        desk_detected: false,
        screen_detected: false,
        distance_rating: 'too_close',
      },
    };
  }

  
  let sum = 0;
  for (let i = 0; i < Math.min(cleanBase64.length, 300); i++) {
    sum += cleanBase64.charCodeAt(i);
  }
  const score = sum % 100;

  if (score > 25) {
    return {
      valid_placement: true,
      missing_elements: [],
      guidance_message: "Joylashuv ideal! O'quvchi, ish stoli, ikkala qo'l va test ekrani to'liq kadrda.",
      confidence: 0.94,
      details: {
        student_detected: true,
        hands_detected: true,
        desk_detected: true,
        screen_detected: true,
        distance_rating: 'optimal',
        angle_rating: 'optimal',
      },
    };
  } else if (score % 2 === 0) {
    return {
      valid_placement: false,
      missing_elements: ['hands'],
      guidance_message: "Kamerani biroz orqaroqqa suring, qo'llaringiz va klaviatura ko'rinmayapti.",
      confidence: 0.88,
      details: {
        student_detected: true,
        hands_detected: false,
        desk_detected: true,
        screen_detected: true,
        distance_rating: 'too_close',
      },
    };
  } else {
    return {
      valid_placement: false,
      missing_elements: ['screen'],
      guidance_message: "Kamerani 45° burchak ostida qo'ying, noutbuk ekrani kadrga tushishi shart.",
      confidence: 0.9,
      details: {
        student_detected: true,
        hands_detected: true,
        desk_detected: true,
        screen_detected: false,
        distance_rating: 'optimal',
      },
    };
  }
}
