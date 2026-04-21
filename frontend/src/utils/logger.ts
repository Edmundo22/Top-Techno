const isDev = import.meta.env.DEV;

export function log(...args: unknown[]): void {
  if (isDev) console.log(...args);
}

export function logData(label: string, data: unknown): void {
  if (isDev) console.log(`[data] ${label}`, data);
}

export function logSuccess(message: string, ...extra: unknown[]): void {
  if (isDev) console.log(`[ok] ${message}`, ...extra);
}

export function logError(message: string, err: unknown, ...extra: unknown[]): void {
  if (isDev) console.error(`[err] ${message}`, err, ...extra);
}
