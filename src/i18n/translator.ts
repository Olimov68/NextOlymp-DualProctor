import i18n from './index';

const TRANSLATION_MAP: Record<string, { ru: string; en: string }> = {
  
  'Andijon viloyati': { ru: 'Андижанская область', en: 'Andijan Region' },
  'Buxoro viloyati': { ru: 'Бухарская область', en: 'Bukhara Region' },
  'Farg‘ona viloyati': { ru: 'Ферганская область', en: 'Fergana Region' },
  'Jizzax viloyati': { ru: 'Джизакская область', en: 'Jizzakh Region' },
  'Namangan viloyati': { ru: 'Наманганская область', en: 'Namangan Region' },
  'Navoiy viloyati': { ru: 'Навоийская область', en: 'Navoi Region' },
  'Qashqadaryo viloyati': { ru: 'Кашкадарьинская область', en: 'Kashkadarya Region' },
  "Qoraqolpog'iston Respublikasi": { ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan' },
  'Samarqand viloyati': { ru: 'Самаркандская область', en: 'Samarkand Region' },
  'Sirdaryo viloyati': { ru: 'Сырдарьинская область', en: 'Syrdarya Region' },
  'Surxondaryo viloyati': { ru: 'Сурхандарьинская область', en: 'Surkhandarya Region' },
  'Toshkent viloyati': { ru: 'Ташкентская область', en: 'Tashkent Region' },
  'Toshkent shahri': { ru: 'город Ташкент', en: 'Tashkent City' },
  'Xorazm viloyati': { ru: 'Хорезмская область', en: 'Khorezm Region' },

  
  'Boshqaruv paneli': { ru: 'Панель управления', en: 'Dashboard' },
  'Olimpiadalar': { ru: 'Олимпиады', en: 'Olympiads' },
  'Foydalanuvchilar': { ru: 'Пользователи', en: 'Users' },
  'Hududlar': { ru: 'Регионы', en: 'Locations' },
  'To\'lovlar': { ru: 'Платежи', en: 'Payments' },
  'Xabarnomalar': { ru: 'Уведомления', en: 'Notifications' },
  'Yordam xizmati': { ru: 'Служба поддержки', en: 'Help Support' },
  'Paketlar': { ru: 'Пакеты', en: 'Packages' },

  
  'Foydalanuvchilar Boshqaruvi': { ru: 'Управление пользователями', en: 'User Management' },
  'Jami Foydalanuvchilar': { ru: 'Всего пользователей', en: 'Total Users' },
  "O'g'il bolalar": { ru: 'Мальчики', en: 'Male Students' },
  'Qiz bolalar': { ru: 'Девочки', en: 'Female Students' },
  'Foydalanuvchi qo\'shish': { ru: 'Добавить пользователя', en: 'Add User' },
  'Ustunlar': { ru: 'Колонки', en: 'Columns' },
  'F.I.Sh.': { ru: 'ФИО', en: 'Full Name' },
  'Telefon': { ru: 'Телефон', en: 'Phone' },
  'ID': { ru: 'ID', en: 'ID' },
  'Rol': { ru: 'Роль', en: 'Role' },
  'Paket': { ru: 'Пакет', en: 'Package' },
  'Holati': { ru: 'Статус', en: 'Status' },
  'Manzil': { ru: 'Адрес', en: 'Address' },
  'Tuman': { ru: 'Район', en: 'District' },
  'Maktab': { ru: 'Школа', en: 'School' },
  'Sinf': { ru: 'Класс', en: 'Grade' },
  'Ro\'yxatdan o\'tgan': { ru: 'Зарегистрирован', en: 'Registered Date' },
  'Ishtirok': { ru: 'Участие', en: 'Participations' },
  'Amallar': { ru: 'Действия', en: 'Actions' },

  
  'O\'quvchi': { ru: 'Ученик', en: 'Student' },
  'O\'qituvchi': { ru: 'Учитель', en: 'Teacher' },
  'Admin': { ru: 'Администратор', en: 'Admin' },
  'Faol': { ru: 'Активный', en: 'Active' },
  'Bloklangan': { ru: 'Заблокирован', en: 'Blocked' },
  'Bepul': { ru: 'Бесплатный', en: 'Free' },
  'Standard': { ru: 'Стандарт', en: 'Standard' },
  'Pro': { ru: 'Про', en: 'Pro' },
  'VIP': { ru: 'VIP', en: 'VIP' },

  
  "Yangi Foydalanuvchi Qo'shish": { ru: 'Добавить нового пользователя', en: 'Add New User' },
  "Foydalanuvchini tahrirlash": { ru: 'Редактировать пользователя', en: 'Edit User' },
  "Bekor qilish": { ru: 'Отмена', en: 'Cancel' },
  "Saqlash": { ru: 'Сохранить', en: 'Save' },
  "O'chirish": { ru: 'Удалить', en: 'Delete' },
  "Tahrirlash": { ru: 'Редактировать', en: 'Edit' },
  "Bloklash": { ru: 'Заблокировать', en: 'Block' },
  "Blokdan chiqarish": { ru: 'Разблокировать', en: 'Unblock' },
  "Sahifa": { ru: 'Страница', en: 'Page' },
  "dan": { ru: 'из', en: 'of' },
  "Oldingisi": { ru: 'Назад', en: 'Previous' },
  "Keyingisi": { ru: 'Вперед', en: 'Next' },

  
  "Yordam Xizmati Bo'limi": { ru: 'Служба поддержки', en: 'Help Support Desk' },
  "Murojaatlar ro'yxati": { ru: 'Список обращений', en: 'Support Tickets' },
  "API Kaliti": { ru: 'API Ключ', en: 'API Key' },
  "AI Bilan Yaratish": { ru: 'Сгенерировать ИИ', en: 'Generate with AI' },
  "Javob Yuborish": { ru: 'Отправить ответ', en: 'Send Reply' },
  "Muammoni yopish": { ru: 'Закрыть проблему', en: 'Close Ticket' },
  "Yangi": { ru: 'Новый', en: 'New' },
  "Jarayonda": { ru: 'В процессе', en: 'In Progress' },
  "Hal etildi": { ru: 'Решено', en: 'Resolved' },
  "Yopildi": { ru: 'Закрыто', en: 'Closed' },

  
  "JAMI SMS": { ru: 'ВСЕГО СМС', en: 'TOTAL SMS' },
  "QABUL QILINGAN": { ru: 'ДОСТАВЛЕНО', en: 'DELIVERED' },
  "YUBORILMADI": { ru: 'НЕ ДОСТАВЛЕНО', en: 'FAILED' },
  "YETKAZILISH": { ru: 'ДОСТАВКА', en: 'DELIVERY RATE' },
  "SMS YUBORISH": { ru: 'ОТПРАВКА СМС', en: 'SEND SMS' },
  "SMS yuborish": { ru: 'Отправить СМС', en: 'Send SMS' },
  "Bildirishnoma": { ru: 'Уведомление', en: 'Notification' },
  "Parol": { ru: 'Пароль', en: 'Password' },
  "Tasdiqlash": { ru: 'Подтверждение', en: 'Verification (OTP)' },
  "Xavfsizlik ogohlantirishi": { ru: 'Предупреждение', en: 'Security Alert' },
  "Tranzaksiya": { ru: 'Транзакция', en: 'Transaction' },
  "OTP kodlar": { ru: 'Коды OTP', en: 'OTP Codes' },
  "Bildirishnomalar": { ru: 'Уведомления', en: 'Announcements' },

  
  "To'lovlar va Moliya Boshqaruvi": { ru: 'Управление платежами и финансами', en: 'Payments & Finance Management' },
  "Jami Ishtirokchilar": { ru: 'Всего участников', en: 'Total Participants' },
  "To'lov Qilganlar": { ru: 'Оплачено', en: 'Paid' },
  "Kutilayotganlar": { ru: 'Ожидают оплаты', en: 'Pending Payment' },
  "Karta Tushumi": { ru: 'Поступления по картам', en: 'Card Revenue' },
  "Naqd Tushum": { ru: 'Наличные поступления', en: 'Cash Revenue' },
  "Hamyon Tushumi": { ru: 'Поступления с кошелька', en: 'Wallet Revenue' },
  "Paket Orqali Qatnashayotganlar": { ru: 'Участники по пакету', en: 'Package Subscribers' },
  "To'lov Usuli": { ru: 'Способ оплаты', en: 'Payment Method' },
  "Karta (Click/Payme)": { ru: 'Карта (Click/Payme)', en: 'Card (Click/Payme)' },
  "Naqd pul": { ru: 'Наличные', en: 'Cash' },
  "Hamyon": { ru: 'Кошелек (Баланс)', en: 'Wallet' },
  "Paket obunasi": { ru: 'Подписка пакета', en: 'Package Subscription' },
  "Muvaffaqiyatli": { ru: 'Успешно', en: 'Successful' },
  "Bekor qilindi": { ru: 'Отменено', en: 'Cancelled' },

  
  "Olimpiadalar Boshqaruvi": { ru: 'Управление олимпиадами', en: 'Olympiads Management' },
  "Jami Olimpiadalar": { ru: 'Всего олимпиад', en: 'Total Olympiads' },
  "Ochiq (Faol)": { ru: 'Открытые (Активные)', en: 'Open (Active)' },
  "Yopiq (Tugagan)": { ru: 'Закрытые (Завершенные)', en: 'Closed (Finished)' },
  "Jami Tushum": { ru: 'Общий доход', en: 'Total Revenue' },
  "Olimpiada yaratish": { ru: 'Создать олимпиаду', en: 'Create Olympiad' },
  "Yangi Olimpiada Yaratish": { ru: 'Создать новую олимпиаду', en: 'Create New Olympiad' },
  "Olimpiadani tahrirlash": { ru: 'Редактировать олимпиаду', en: 'Edit Olympiad' },
  "Qadab qo'yish": { ru: 'Закрепить', en: 'Pin' },
  "Ko'rish": { ru: 'Просмотр', en: 'View' },
  "Topshirganlar": { ru: 'Сдавшие', en: 'Submitted' },
  "Ro'yxatdan o'tganlar": { ru: 'Зарегистрированные', en: 'Registered' }
};

export const translateText = (text: string, targetLang?: string): string => {
  if (!text) return '';
  const lang = (targetLang || i18n.language || 'uz').toLowerCase();
  if (lang === 'uz') return text;

  
  if (TRANSLATION_MAP[text]) {
    return TRANSLATION_MAP[text][lang as 'ru' | 'en'] || text;
  }

  let translated = text;

  
  if (lang === 'ru') {
    translated = translated
      .replace(/(\d+)\s*(?:ta\s*)?tuman/gi, '$1 районов')
      .replace(/(\d+)\s*(?:ta\s*)?maktab/gi, '$1 школ')
      .replace(/ tumani/g, ' район')
      .replace(/ shahri/g, ' город')
      .replace(/ viloyati/g, ' область')
      .replace(/ maktabi/g, ' школа')
      .replace(/sonli umumta'lim maktabi/gi, 'общеобразовательная школа №')
      .replace(/sonli maktab/gi, 'школа №')
      .replace(/student/gi, 'Ученик')
      .replace(/teacher/gi, 'Учитель')
      .replace(/admin/gi, 'Администратор')
      .replace(/active/gi, 'Активный')
      .replace(/blocked/gi, 'Заблокирован');
  } else if (lang === 'en') {
    translated = translated
      .replace(/(\d+)\s*(?:ta\s*)?tuman/gi, '$1 districts')
      .replace(/(\d+)\s*(?:ta\s*)?maktab/gi, '$1 schools')
      .replace(/ tumani/g, ' District')
      .replace(/ shahri/g, ' City')
      .replace(/ viloyati/g, ' Region')
      .replace(/ maktabi/g, ' School')
      .replace(/sonli umumta'lim maktabi/gi, 'Comprehensive School No.')
      .replace(/sonli maktab/gi, 'School No.')
      .replace(/student/gi, 'Student')
      .replace(/teacher/gi, 'Teacher')
      .replace(/admin/gi, 'Admin')
      .replace(/active/gi, 'Active')
      .replace(/blocked/gi, 'Blocked');
  }

  return translated;
};
