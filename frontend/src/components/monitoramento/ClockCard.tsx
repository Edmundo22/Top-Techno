import { useTick } from '../../hooks/useTick';
import { formatClockLong } from '../../utils/datetime';

export function ClockCard() {
  const nowMs = useTick(1000);
  const { date, time } = formatClockLong(new Date(nowMs));

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1 text-xs shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-ink" aria-hidden />
      <span className="text-brand-ink-muted">Agora:</span>
      <span className="font-medium text-brand-ink">{date}</span>
      <span className="tabular-nums font-semibold text-brand-ink">{time}</span>
    </div>
  );
}
