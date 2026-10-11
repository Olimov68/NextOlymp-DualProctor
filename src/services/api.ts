/**
 * Ibn Sino Mock Exam & Olympiad Platform - Unified Secure API Client
 * - Server-Authoritative HttpOnly cookie transport via credentials: 'include'
 * - Strict typed error contracts
 * - Proper 204 No Content and non-swallowing JSON parsing
 */

export interface ApiErrorData {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;
  public response: { status: number; data: ApiErrorData };

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.response = {
      status,
      data: { status, code, message, details },
    };
  }
}

const BASE_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Map legacy PHP paths to modern REST API endpoints
const mapEndpoint = (endpoint: string): string => {
  let clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (clean.includes('/users.php?id=')) {
    const id = clean.split('/users.php?id=')[1];
    clean = `/users/${id}`;
  } else if (clean.includes('/national-exams.php?id=')) {
    const id = clean.split('/national-exams.php?id=')[1];
    clean = `/exams/${id}`;
  } else if (clean.includes('/exams?id=')) {
    const id = clean.split('/exams?id=')[1];
    clean = `/exams/${id}`;
  } else if (clean.startsWith('/olympiads.php')) {
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
    clean = clean.replace(/\/(security|anticheat)\.php/, '/anticheat');
  } else if (clean.startsWith('/logs.php')) {
    clean = clean.replace('/logs.php', '/admin/system-metrics');
  } else if (clean.startsWith('/leaderboard.php')) {
    clean = clean.replace('/leaderboard.php', '/leaderboard');
  }

  return clean;
};

const getHeaders = (extraHeaders?: Record<string, string>): HeadersInit => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(extraHeaders || {}),
  };

  return headers;
};

const safeParseJson = async <T>(res: Response): Promise<T> => {
  if (res.status === 204) {
    return null as unknown as T;
  }
  const text = await res.text();
  if (!text || text.trim() === '') {
    return null as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (err: any) {
    throw new ApiError(res.status, "Serverdan noto'g'ri JSON formatida javob keldi", 'INVALID_JSON_RESPONSE', {
      rawText: text.slice(0, 200),
    });
  }
};

const createApiError = (res: Response, errText: string): ApiError => {
  let errMsg = `Server xatoligi (${res.status})`;
  let errCode: string | undefined = undefined;
  let details: unknown = undefined;

  try {
    const parsed = JSON.parse(errText);
    if (parsed.error) errMsg = parsed.error;
    else if (parsed.message) errMsg = parsed.message;
    if (parsed.code) errCode = parsed.code;
    if (parsed.details) details = parsed.details;
  } catch {
    if (errText && errText.trim().length > 0) {
      errMsg = errText.slice(0, 150);
    }
  }

  return new ApiError(res.status, errMsg, errCode, details);
};

export const apiClient = {
  baseURL: BASE_URL,

  async get<T = any>(endpoint: string): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (networkError: any) {
      // Safe 1-time retry for idempotent GET requests
      try {
        res = await fetch(targetUrl, {
          headers: getHeaders(),
          credentials: 'include',
        });
      } catch (retryError: any) {
        throw new ApiError(0, "Internet bilan aloqa uzildi yoki server javob bermadi", 'NETWORK_ERROR', retryError);
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      throw createApiError(res, errText);
    }

    return safeParseJson<T>(res);
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: data !== undefined ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });
    } catch (netErr: any) {
      throw new ApiError(0, "Internet bilan aloqa uzildi yoki server javob bermadi", 'NETWORK_ERROR', netErr);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw createApiError(res, errText);
    }

    return safeParseJson<T>(res);
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: data !== undefined ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });
    } catch (netErr: any) {
      throw new ApiError(0, "Internet bilan aloqa uzildi yoki server javob bermadi", 'NETWORK_ERROR', netErr);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw createApiError(res, errText);
    }

    return safeParseJson<T>(res);
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const targetUrl = `${BASE_URL}${mapEndpoint(endpoint)}`;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
    } catch (netErr: any) {
      throw new ApiError(0, "Internet bilan aloqa uzildi yoki server javob bermadi", 'NETWORK_ERROR', netErr);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw createApiError(res, errText);
    }

    return safeParseJson<T>(res);
  },
};

export default apiClient;
