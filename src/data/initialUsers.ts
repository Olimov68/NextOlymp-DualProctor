export interface UserItem {
  id: string;
  fullName: string;
  email?: string;
  gender: 'male' | 'female';
  phone: string;
  role: 'student' | 'teacher' | 'admin';
  package: 'Bepul' | 'Standard' | 'Pro' | 'VIP';
  status: 'active' | 'blocked';
  region: string;
  district: string;
  school: string;
  grade?: number;
  createdAt: string;
  participationCount: number;
}

export const INITIAL_USERS: UserItem[] = [];
