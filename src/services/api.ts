

const BASE_URL = '/api';

const safeParseJson = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  if (!text || text.trim().startsWith('<?php') || text.trim().startsWith('<!DOCTYPE')) {
    return [] as unknown as T;
  }
  try {
    return JSON.parse(text);
  } catch {
    return [] as unknown as T;
  }
};

export const apiClient = {
  async get<T = any>(endpoint: string): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Xatolik: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }
    return safeParseJson<T>(res);
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Xatolik: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }
    return safeParseJson<T>(res);
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Xatolik: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }
    return safeParseJson<T>(res);
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Xatolik: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errMsg = parsed.message;
      } catch {}
      throw new Error(errMsg);
    }
    return safeParseJson<T>(res);
  }
};

export default apiClient;
