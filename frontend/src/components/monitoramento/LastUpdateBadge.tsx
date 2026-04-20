import { Card } from '../ui/Card';
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

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-brand-ink-muted">
        Atualização ao vivo
      </span>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-brand-accent' : error ? 'bg-red-500' : 'bg-emerald-500'}`}
          aria-hidden
        />
        <span className="text-sm font-semibold text-brand-ink">
          {error ? 'Erro ao atualizar' : `Atualizado ${relative}`}
        </span>
      </div>
      <span className="text-xs text-brand-ink-muted">
        {error
          ? error
          : `Intervalo de poll: ${Math.round(intervalMs / 1000)} s · próxima em ${nextInSec ?? '—'} s`}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-1 self-start rounded-md border border-brand-line bg-brand-surface px-2 py-1 text-[11px] font-medium text-brand-ink hover:bg-brand-line-soft"
      >
        Atualizar agora
      </button>
    </Card>
  );
}
