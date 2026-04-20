import { Card } from '../ui/Card';
import { useTick } from '../../hooks/useTick';
import { formatClockLong } from '../../utils/datetime';

export function ClockCard() {
  const nowMs = useTick(1000);
  const { date, time } = formatClockLong(new Date(nowMs));

  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-brand-ink-muted">
        Data e hora atuais
      </span>
      <span className="text-sm text-brand-ink">{date}</span>
      <span className="text-3xl font-semibold tabular-nums text-brand-ink">{time}</span>
    </Card>
  );
}
