import axios, { type AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  // 60s: as consultas das tabelas de monitoramento (ex.: horários de entrada/
  // saída por viagem) podem demorar mais que os 15s antigos e estavam dando
  // timeout. Como o polling agora roda a cada 1 min, há folga de sobra.
  timeout: 60000,
});

export interface ApiErrorBody {
  error: string;
  details?: Record<string, string[]>;
}

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  const ax = err as AxiosError<ApiErrorBody>;
  return ax.response?.data?.error ?? ax.message ?? fallback;
}
