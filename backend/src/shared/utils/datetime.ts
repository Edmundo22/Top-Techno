export function toIsoLocal(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const BR_TZ = 'America/Sao_Paulo';

/**
 * "Hoje" no fuso de Brasília (UTC-3), no formato 'YYYY-MM-DD'.
 *
 * Usado nas queries de monitoramento no lugar de `CAST(GETDATE() AS DATE)`.
 * `GETDATE()` depende do fuso do SQL Server (frequentemente UTC em servidores
 * cloud), o que faz veículos "sumirem" da tela à noite-no-Brasil quando o dia
 * UTC vira. Computar no Node com `Intl.DateTimeFormat({ timeZone: 'America/Sao_Paulo' })`
 * garante que o filtro use a data percebida pelo operador, independente de
 * onde o Node ou o SQL Server estejam rodando.
 */
export function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
