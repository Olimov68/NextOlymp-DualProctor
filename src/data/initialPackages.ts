export interface PackageItem {
  id: string;
  nomi: string;
  narxi: number; 
  davomiyligi: string; 
  tavsif: string;
  imkoniyatlar: string[]; 
  sotilganSoni: number;
  jamiTushum: number; 
  holati: 'sotuvda' | 'nofaol';
  badge?: string; 
  createdAt: string;
}

export const INITIAL_PACKAGES: PackageItem[] = [
  {
    id: 'PKG-001',
    nomi: 'Bepul',
    narxi: 0,
    davomiyligi: 'Cheksiz',
    tavsif: "Platforma bilan tanishish uchun boshlang'ich paket",
    imkoniyatlar: [
      "2 ta bepul namonaviy olimpiadada qatnashish",
      "Umumiy reytingni ko'rish",
      "Boshlang'ich natijalar tahlili"
    ],
    sotilganSoni: 850,
    jamiTushum: 0,
    holati: 'sotuvda',
    createdAt: '2025-01-10'
  },
  {
    id: 'PKG-002',
    nomi: 'Standard',
    narxi: 29000,
    davomiyligi: '1 oy',
    tavsif: "Maktab o'quvchilari uchun eng ko'p tanlanadigan paket",
    imkoniyatlar: [
      "Barcha fandan oylik sinov testlari",
      "Tuman va viloyat reytingida qatnashish",
      "Elektron ishtirokchi sertifikati",
      "SMS xabarnomalar"
    ],
    sotilganSoni: 320,
    jamiTushum: 9280000,
    holati: 'sotuvda',
    badge: 'Mashhur',
    createdAt: '2025-01-15'
  },
  {
    id: 'PKG-003',
    nomi: 'Pro',
    narxi: 59000,
    davomiyligi: '1 oy',
    tavsif: "Chuqurlashtirilgan akademik va olimpiada tayyorgarligi",
    imkoniyatlar: [
      "Cheksiz barcha Respublika olimpiadalari",
      "Batafsil xatolar tahlili va yechimlar",
      "Rasmiy PDF diplom va sertifikatlar",
      "VIP proctoring va tezkor qo'llab-quvvatlash"
    ],
    sotilganSoni: 180,
    jamiTushum: 10620000,
    holati: 'sotuvda',
    badge: 'Tavsiya etiladi',
    createdAt: '2025-02-01'
  },
  {
    id: 'PKG-004',
    nomi: 'VIP Yillik',
    narxi: 199000,
    davomiyligi: '1 yil',
    tavsif: "Butun yil davomida to'liq cheklovlarsiz eksklyuziv imkoniyatlar",
    imkoniyatlar: [
      "12 oy davomida barcha ochiq va yopiq olimpiadalar",
      "Eksklyuziv tayyorgarlik test bazasi",
      "Shaxsiy tutor (ustoz) maslahatlari",
      "Original bosma diplom va medalyonlar",
      "24/7 ustuvor qo'llab-quvvatlash"
    ],
    sotilganSoni: 115,
    jamiTushum: 22885000,
    holati: 'sotuvda',
    badge: 'Eksklyuziv',
    createdAt: '2025-02-10'
  }
];
