import type { Certificate } from '../types';
import { apiClient, ApiError } from './api';

export const certificateService = {
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    const response = await apiClient.get<{ data: Certificate[] }>(`/certificates?user_id=${encodeURIComponent(userId)}`);
    return response.data;
  },
  async verifyCertificate(code: string): Promise<Certificate | null> {
    try {
      const response = await apiClient.get<{ valid: boolean; certificate: Certificate }>(
        `/certificates/${encodeURIComponent(code.trim().toUpperCase())}`,
      );
      return response.valid ? response.certificate : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async getAllCertificates(): Promise<Certificate[]> {
    return (await apiClient.get<{ data: Certificate[] }>('/certificates')).data;
  },
};

