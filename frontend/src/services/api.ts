import axios, { type AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

export interface ApiErrorBody {
  error: string;
  details?: Record<string, string[]>;
}

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  const ax = err as AxiosError<ApiErrorBody>;
  return ax.response?.data?.error ?? ax.message ?? fallback;
}
