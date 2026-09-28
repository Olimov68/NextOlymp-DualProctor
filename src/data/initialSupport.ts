export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
}

export interface SupportTicket {
  id: string;
  userId?: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'parent';
  userPhone: string;
  userEmail: string;
  subject: string;
  category: 'Olimpiada' | 'To\'lov' | 'Sertifikat' | 'Texnik muammo' | 'Boshqa';
  priority: 'yuqori' | 'orta' | 'past';
  status: 'yangi' | 'jarayonda' | 'hal_etildi' | 'yopildi';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export const INITIAL_TICKETS: SupportTicket[] = [];
