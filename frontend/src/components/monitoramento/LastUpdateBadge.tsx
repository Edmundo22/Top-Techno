import { useTick } from '../../hooks/useTick';
import { formatRelative } from '../../utils/datetime';

interface LastUpdateBadgeProps {
  lastUpdate: number | null;
  intervalMs: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function LastUpdateBadge({
  lastUpdate,
  intervalMs,
  loading,
  error,
  onRefresh,
}: LastUpdateBadgeProps) {
  const nowMs = useTick(1000);

  const relative = lastUpdate ? formatRelative(lastUpdate, nowMs) : '—';
  const nextInSec =
    lastUpdate != null
      ? Math.max(0, Math.ceil((lastUpdate + intervalMs - nowMs) / 1000))
      : null;

  const dot = loading
    ? 'animate-pulse bg-brand-accent'
    : error
    ? 'bg-red-500'
    : 'bg-emerald-500';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1 text-xs shadow-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      <span className="font-medium text-brand-ink">
        {error ? 'Erro' : `Atualizado ${relative}`}
      </span>
      <span className="text-brand-ink-muted">
        {error ? error : `· próxima em ${nextInSec ?? '—'}s`}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        className="ml-1 rounded-full border border-brand-line px-2 py-0.5 text-[11px] font-medium text-brand-ink hover:bg-brand-line-soft"
        title="Atualizar agora"
      >
        ↻
      </button>
    </div>
  );
}
