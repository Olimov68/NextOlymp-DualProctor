import { create } from 'zustand';
import { SupportTicket } from '../data/initialSupport';
import { apiClient } from '../services/api';

interface SupportStore {
  tickets: SupportTicket[];
  loading: boolean;
  selectedTicketId: string | null;
  fetchTickets: () => Promise<void>;
  setSelectedTicketId: (id: string | null) => void;
  createTicket: (ticketData: { userId?: string; userName: string; userPhone: string; userEmail: string; userRole?: 'student' | 'teacher'; subject: string; category: SupportTicket['category']; priority?: SupportTicket['priority']; messageText: string; }) => Promise<string>;
  addMessageToTicket: (ticketId: string, text: string, sender?: 'admin' | 'user', attachments?: SupportTicket['messages'][number]['attachments']) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  closeTicket: (ticketId: string) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
}

const dataOf = (response: any): SupportTicket[] => Array.isArray(response?.data) ? response.data : [];

export const useSupportStore = create<SupportStore>((set, get) => ({
  tickets: [], loading: false, selectedTicketId: null,
  fetchTickets: async () => { set({ loading: true }); try { const response = await apiClient.get('/support/tickets'); set({ tickets: dataOf(response), loading: false }); } catch (error) { set({ loading: false }); throw error; } },
  setSelectedTicketId: (id) => set({ selectedTicketId: id }),
  createTicket: async (ticketData) => {
    const response = await apiClient.post<{ data: SupportTicket }>('/support/tickets', { subject: ticketData.subject, category: ticketData.category, priority: ticketData.priority || 'orta', messageText: ticketData.messageText });
    const ticket = response?.data; if (!ticket?.id) throw new Error('Server murojaatni yaratmadi');
    set(state => ({ tickets: [ticket, ...state.tickets], selectedTicketId: ticket.id })); return ticket.id;
  },
  addMessageToTicket: async (ticketId, text, _sender = 'admin', attachments) => { const response = await apiClient.post<{ data: SupportTicket }>(`/support/tickets/${encodeURIComponent(ticketId)}/messages`, { text, attachments }); if (response?.data) set(state => ({ tickets: state.tickets.map(ticket => ticket.id === ticketId ? response.data : ticket) })); },
  updateTicketStatus: async (ticketId, status) => { const response = await apiClient.put<{ data: SupportTicket }>(`/support/tickets/${encodeURIComponent(ticketId)}`, { status }); if (response?.data) set(state => ({ tickets: state.tickets.map(ticket => ticket.id === ticketId ? response.data : ticket) })); },
  closeTicket: async (ticketId) => get().updateTicketStatus(ticketId, 'yopildi'),
  deleteTicket: async (ticketId) => { await apiClient.delete(`/support/tickets/${encodeURIComponent(ticketId)}`); set(state => ({ tickets: state.tickets.filter(ticket => ticket.id !== ticketId), selectedTicketId: state.selectedTicketId === ticketId ? null : state.selectedTicketId })); },
}));
