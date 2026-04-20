const MES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const DIA_SEMANA_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

function parseLocal(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatBRDateTime(value: string | Date | null | undefined): string {
  if (value == null) return '—';
  const d = parseLocal(value);
  if (!d) return '—';
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatBRDateTimeFull(value: string | Date | null | undefined): string {
  if (value == null) return '—';
  const d = parseLocal(value);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatClockLong(d: Date): { date: string; time: string } {
  const date = `${DIA_SEMANA_PT[d.getDay()]}, ${d.getDate()} de ${MES_PT[d.getMonth()]} de ${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { date, time };
}

export function formatRelative(fromMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  if (diffSec < 60) return `há ${diffSec} s`;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  if (min < 60) return `há ${min} min ${sec} s`;
  const hr = Math.floor(min / 60);
  return `há ${hr} h ${min % 60} min`;
}
