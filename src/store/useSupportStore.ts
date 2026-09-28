import { create } from 'zustand';
import { SupportTicket, TicketMessage, INITIAL_TICKETS } from '../data/initialSupport';

const STORAGE_KEY = 'next_olymp_tickets';

const getStoredTickets = (): SupportTicket[] => {
  if (typeof window === 'undefined') return INITIAL_TICKETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for tickets:', e);
  }
  return INITIAL_TICKETS;
};

const persistTickets = (items: SupportTicket[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for tickets:', e);
  }
};

interface SupportStore {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  createTicket: (ticketData: {
    userId?: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    userRole?: 'student' | 'teacher';
    subject: string;
    category: "To'lov" | "Texnik muammo" | "Sertifikat" | "Olimpiada" | "Boshqa";
    priority?: "past" | "orta" | "yuqori";
    messageText: string;
  }) => string;
  addMessageToTicket: (
    ticketId: string,
    text: string,
    sender?: 'admin' | 'user',
    attachments?: { name: string; size: string; type: string }[]
  ) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  closeTicket: (ticketId: string) => void;
  deleteTicket: (ticketId: string) => void;
  resetTickets: () => void;
}

export const useSupportStore = create<SupportStore>((set, get) => ({
  tickets: getStoredTickets(),
  selectedTicketId: null,

  setSelectedTicketId: (id) => set({ selectedTicketId: id }),

  createTicket: (ticketData) => {
    const currentTickets = get().tickets;
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      id: newId,
      userId: ticketData.userId || `USR-${Math.floor(100 + Math.random() * 900)}`,
      userName: ticketData.userName,
      userPhone: ticketData.userPhone,
      userEmail: ticketData.userEmail,
      userRole: ticketData.userRole || 'student',
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority || 'orta',
      status: 'yangi',
      createdAt: timestampStr,
      updatedAt: timestampStr,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          senderName: ticketData.userName,
          text: ticketData.messageText,
          timestamp: timestampStr
        }
      ]
    };

    const updatedTickets = [newTicket, ...currentTickets];
    persistTickets(updatedTickets);
    set({ tickets: updatedTickets, selectedTicketId: newId });
    return newId;
  },

  addMessageToTicket: (ticketId, text, sender = 'admin', attachments) => {
    const currentTickets = get().tickets;
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const targetTicket = currentTickets.find(t => t.id === ticketId);
    const senderName = sender === 'admin' ? 'EGA Support (Admin)' : (targetTicket?.userName || 'Ishtirokchi');

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender,
      senderName,
      text,
      timestamp: timestampStr,
      attachments,
    };

    const updatedTickets = currentTickets.map((ticket) => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          messages: [...ticket.messages, newMessage],
          status: sender === 'admin' ? ('jarayonda' as const) : ('yangi' as const),
          lastUpdated: timestampStr,
        };
      }
      return ticket;
    });

    persistTickets(updatedTickets);
    set({ tickets: updatedTickets });
  },

  updateTicketStatus: (ticketId, status) => {
    const updatedTickets = get().tickets.map((t) => (t.id === ticketId ? { ...t, status } : t));
    persistTickets(updatedTickets);
    set({ tickets: updatedTickets });
  },

  closeTicket: (ticketId) => {
    get().updateTicketStatus(ticketId, 'yopildi');
  },

  deleteTicket: (ticketId) => {
    const updated = get().tickets.filter((t) => t.id !== ticketId);
    persistTickets(updated);
    set({
      tickets: updated,
      selectedTicketId: get().selectedTicketId === ticketId ? null : get().selectedTicketId,
    });
  },

  resetTickets: () => {
    persistTickets(INITIAL_TICKETS);
    set({ tickets: INITIAL_TICKETS, selectedTicketId: null });
  },
}));
