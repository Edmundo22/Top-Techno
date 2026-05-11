export type PontoParadaRaw = string | number | boolean | null | undefined;

export function normalizePontoParada(value: PontoParadaRaw): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'SIM' : 'NÃO';
  if (typeof value === 'number') return value === 0 ? 'NÃO' : 'SIM';
  return String(value).trim() || null;
}
