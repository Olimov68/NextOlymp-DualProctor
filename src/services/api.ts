/**
 * Ibn Sino Mock Exam & Olympiad Platform - Unified API Client
 */

const BASE_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const getToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('ibn_sino_token') || localStorage.getItem('next_olymp_jwt') || '';
};

// Map legacy PHP paths to modern REST API endpoints
const mapEndpoint = (endpoint: string): string => {
  let clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (clean.startsWith('/olympiads.php')) {
    clean = clean.replace('/olympiads.php', '/exams');
  } else if (clean.startsWith('/national-exams.php')) {
    clean = clean.replace('/national-exams.php', '/exams');
  } else if (clean.startsWith('/users.php')) {
    clean = clean.replace('/users.php', '/users');
  } else if (clean.startsWith('/submissions.php')) {
    clean = clean.replace('/submissions.php', '/submissions');
  } else if (clean.startsWith('/auth.php')) {
    clean = clean.replace('/auth.php', '/auth/login');
  } else if (clean.startsWith('/security.php') || clean.startsWith('/anticheat.php')) {
    clean = clean.replace(/\/(security|anticheat)\.php/, '/exams/IBN-MED-101/proctor-event');
  } else if (clean.startsWith('/logs.php')) {
    clean = clean.replace('/logs.php', '/admin/system-metrics');
  }

  return clean;
};

const getHeaders = (extraHeaders?: Record<string, string>): HeadersInit => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(extraHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const safeParseJson = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  if (!text) {
    return [] as unknown as T;
  }
  try {
    const json = JSON.parse(text);
    return json;
  } catch {
    return [] as unknown as T;
  }
};

export const apiClient = {
  baseURL: BASE_URL,
  async get<T = any>(endpoint: string): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    const res = await fetch(targetUrl, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Server xatoligi: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) errMsg = parsed.error;
        else if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }

    return safeParseJson<T>(res);
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Server xatoligi: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) errMsg = parsed.error;
        else if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }

    return safeParseJson<T>(res);
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Server xatoligi: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) errMsg = parsed.error;
        else if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }

    return safeParseJson<T>(res);
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    const res = await fetch(targetUrl, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Server xatoligi: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error) errMsg = parsed.error;
        else if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }

    return safeParseJson<T>(res);
  }
};

export default apiClient;
