import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LevelQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string; 
  explanation: string;
  points: number;
}

export interface LevelTestSet {
  id: string;
  title: string;
  subject: 'math' | 'physics' | 'chemistry' | 'biology' | 'informatics';
  year: number; 
  grade: number; 
  difficulty: 'boshlangich' | 'orta' | 'yuqori' | 'olimpiada';
  durationMinutes: number;
  totalQuestions: number;
  questions: LevelQuestion[];
  createdAt: string;
}

interface LevelTestStore {
  testSets: LevelTestSet[];
  addTestSet: (newSet: Omit<LevelTestSet, 'id' | 'createdAt'>) => void;
  deleteTestSet: (id: string) => void;
  updateTestSet: (id: string, updated: Partial<LevelTestSet>) => void;
}

const INITIAL_LEVEL_TESTS: LevelTestSet[] = [
  {
    id: 'lvl-math-2025-9',
    title: "O'tgan yillik olimpiada testlari (2025 - 9-sinf Matematika)",
    subject: 'math',
    year: 2025,
    grade: 9,
    difficulty: 'olimpiada',
    durationMinutes: 45,
    totalQuestions: 5,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'lq-1',
        questionText: "Agar x^2 + y^2 = 25 va xy = 12 bo'lsa, |x + y| ning qiymatini toping.",
        options: ['7', '5', '6', '8'],
        correctAnswer: 'A',
        explanation: "(x+y)^2 = x^2 + y^2 + 2xy = 25 + 24 = 49. Shunday qilib |x+y| = 7.",
        points: 20
      },
      {
        id: 'lq-2',
        questionText: "Aylana radiusining uzunligi 10 sm. Markazidan 6 sm masofada joylashgan vatarning uzunligini hisoblang.",
        options: ['12 sm', '16 sm', '14 sm', '18 sm'],
        correctAnswer: 'B',
        explanation: "Pifagor teoremasiga ko'ra vatar yarmi d = sqrt(10^2 - 6^2) = 8 sm. Vatar = 16 sm.",
        points: 20
      },
      {
        id: 'lq-3',
        questionText: "Ketma-ket 5 ta toq sonning yig'indisi 105 ga teng. Ularning eng kichigini toping.",
        options: ['17', '19', '15', '21'],
        correctAnswer: 'A',
        explanation: "O'rtacha son = 105/5 = 21. Eng kichik son = 21 - 4 = 17.",
        points: 20
      },
      {
        id: 'lq-4',
        questionText: "Bir vaqtning o'zida ikkita kubik tashlanganda ularning yig'indisi 8 bo'lish ehtimolini toping.",
        options: ['5/36', '1/6', '7/36', '4/36'],
        correctAnswer: 'A',
        explanation: "Hosil bo'ladigan juftliklar: (2,6),(3,5),(4,4),(5,3),(6,2) - jami 5 ta. Ehtimol = 5/36.",
        points: 20
      },
      {
        id: 'lq-5',
        questionText: "2^2024 ning oxirgi raqami nechaga teng?",
        options: ['6', '2', '4', '8'],
        correctAnswer: 'A',
        explanation: "2 ning darajalari sikli: 2, 4, 8, 6. 2024 mod 4 = 0, ya'ni oxirgi raqam 6.",
        points: 20
      }
    ]
  },
  {
    id: 'lvl-inf-2024-10',
    title: "Darajani aniqlash testi (Dasturlash va Informatika 2024)",
    subject: 'informatics',
    year: 2024,
    grade: 10,
    difficulty: 'orta',
    durationMinutes: 30,
    totalQuestions: 4,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'lq-11',
        questionText: "C++ tilida vector.push_back() operatsiyasining amortizatsiyalangan vaqt murakkabligi qanday?",
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N^2)'],
        correctAnswer: 'A',
        explanation: "Vector element qo'shganda massiv sig'imi 2 barobar oshiriladi. Amortizatsiya qilingan vaqt O(1).",
        points: 25
      },
      {
        id: 'lq-12',
        questionText: "BFS (Breadth-First Search) algoritmi qaysi ma'lumotlar tuzilmasidan foydalanadi?",
        options: ['Queue (Navbat)', 'Stack (Stek)', 'Priority Queue', 'Tree'],
        correctAnswer: 'A',
        explanation: "Kenglik bo'ylab qidirish (BFS) elementlarni tartib bilan ko'rish uchun FIFO (Queue) tuzilmasidan foydalanadi.",
        points: 25
      },
      {
        id: 'lq-13',
        questionText: "Python tilida `[i**2 for i in range(5) if i % 2 == 0]` natijasi nima bo'ladi?",
        options: ['[0, 4, 16]', '[1, 9, 25]', '[0, 2, 4]', '[0, 4, 8]'],
        correctAnswer: 'A',
        explanation: "range(5) dan faqat juft sonlar (0, 2, 4) olinadi va ularning kvadratlari [0, 4, 16] hisoblanadi.",
        points: 25
      },
      {
        id: 'lq-14',
        questionText: "Grafda eng qisqa yo'lni topish uchun qaysi algoritm ishlatilmaydi?",
        options: ['Binary Search', 'Dijkstra', 'Floyd-Warshall', 'BFS'],
        correctAnswer: 'A',
        explanation: "Binary search saralangan qidiruv algoritmi bo'lib, grafda yo'l topish uchun ishlatilmaydi.",
        points: 25
      }
    ]
  },
  {
    id: 'lvl-phys-2025-11',
    title: "Fizika Fanidan Respublika Savollari (2025)",
    subject: 'physics',
    year: 2025,
    grade: 11,
    difficulty: 'yuqori',
    durationMinutes: 40,
    totalQuestions: 4,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'lq-21',
        questionText: "Jism v0 = 20 m/s tezlik bilan gorizontga 30° burchak ostida otildi. Maksimal ko'tarilish balandligini toping. (g=10 m/s^2)",
        options: ['5 m', '10 m', '15 m', '20 m'],
        correctAnswer: 'A',
        explanation: "Hmax = (v0*sin(30))^2 / (2g) = (20 * 0.5)^2 / 20 = 100 / 20 = 5 m.",
        points: 25
      },
      {
        id: 'lq-22',
        questionText: "Ideal gazning bosimi 2 marta oshirilib, hajmi 3 marta kamaytirilsa, uning temperaturasi qanday o'zgaradi?",
        options: ['1.5 marta kamayadi', '1.5 marta ortadi', '6 marta ortadi', "O'zgarmaydi"],
        correctAnswer: 'A',
        explanation: "Mendeleyev-Klapeyron: T ~ P*V. P=2P, V=V/3 => T' = (2/3)T = T / 1.5.",
        points: 25
      },
      {
        id: 'lq-23',
        questionText: "Qarshiligi R bo'lgan o'tkazgichni teng 4 qismga bo'lib, ularni parallel ulansa, umumiy qarshilik qancha bo'ladi?",
        options: ['R/16', 'R/4', 'R/8', '4R'],
        correctAnswer: 'A',
        explanation: "Har bir qism qarshiligi R/4. Ularni parallel ulaganda R_eq = (R/4) / 4 = R/16.",
        points: 25
      },
      {
        id: 'lq-24',
        questionText: "Foton energiyasi E bo'lsa, uning impulsini toping (c - yorug'lik tezligi).",
        options: ['E / c', 'E * c', 'c / E', 'E * c^2'],
        correctAnswer: 'A',
        explanation: "Foton uchun p = E / c formulasi o'rinli.",
        points: 25
      }
    ]
  }
];

export const useLevelTestStore = create<LevelTestStore>()(
  persist(
    (set) => ({
      testSets: INITIAL_LEVEL_TESTS,

      addTestSet: (newSet) =>
        set((state) => ({
          testSets: [
            {
              ...newSet,
              id: `lvl-${Date.now()}`,
              createdAt: new Date().toISOString()
            },
            ...state.testSets
          ]
        })),

      deleteTestSet: (id) =>
        set((state) => ({
          testSets: state.testSets.filter((t) => t.id !== id)
        })),

      updateTestSet: (id, updated) =>
        set((state) => ({
          testSets: state.testSets.map((t) => (t.id === id ? { ...t, ...updated } : t))
        }))
    }),
    {
      name: 'next_olymp_level_tests'
    }
  )
);
