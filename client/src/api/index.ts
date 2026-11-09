import type { DailyReport, PaginatedReadings, Reading, ReadingInput, ReportSummary, User } from '../types';
import { apiRequest, queryString } from './http';

interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input }),

  login: (input: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  me: () => apiRequest<{ user: User }>('/auth/me').then((res) => res.user),
};

export const readingsApi = {
  list: (params: { page?: number; limit?: number; from?: string; to?: string } = {}) =>
    apiRequest<PaginatedReadings>(`/readings${queryString(params)}`),

  create: (input: ReadingInput) =>
    apiRequest<{ reading: Reading }>('/readings', { method: 'POST', body: input }).then((res) => res.reading),

  update: (id: number, input: ReadingInput) =>
    apiRequest<{ reading: Reading }>(`/readings/${id}`, { method: 'PUT', body: input }).then((res) => res.reading),

  remove: (id: number) => apiRequest<void>(`/readings/${id}`, { method: 'DELETE' }),
};

export const reportsApi = {
  daily: (date: string) =>
    apiRequest<{ report: DailyReport }>(`/reports/daily${queryString({ date })}`).then((res) => res.report),

  monthToDate: (date: string) =>
    apiRequest<{ report: ReportSummary }>(`/reports/month-to-date${queryString({ date })}`).then((res) => res.report),

  monthly: (date: string) =>
    apiRequest<{ report: ReportSummary }>(`/reports/monthly${queryString({ date })}`).then((res) => res.report),
};
