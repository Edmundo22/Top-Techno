import type { ReactNode } from 'react';

type Variant = 'green' | 'slate' | 'accent' | 'neutral';

interface StatInfoCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  variant?: Variant;
  title?: string;
}

const VARIANT_CARD: Record<Variant, string> = {
  green: 'border-green-200 bg-green-50',
  slate: 'border-brand-line bg-brand-line-soft',
  accent: 'border-brand-accent/60 bg-brand-accent-soft',
  neutral: 'border-brand-line bg-white',
};

const VARIANT_ICON: Record<Variant, string> = {
  green: 'bg-green-600 text-white',
  slate: 'bg-brand-ink text-white',
  accent: 'bg-brand-accent text-brand-ink',
  neutral: 'bg-brand-line-soft text-brand-ink-soft',
};

const VARIANT_BADGE: Record<Variant, string> = {
  green: 'bg-green-600 text-white',
  slate: 'bg-brand-ink text-white',
  accent: 'bg-brand-accent text-brand-ink',
  neutral: 'bg-brand-line-soft text-brand-ink',
};

export function StatInfoCard({
  icon,
  label,
  value,
  hint,
  variant = 'neutral',
  title,
}: StatInfoCardProps) {
  return (
    <div
      title={title}
      className={`flex h-12 min-w-[150px] flex-1 items-center gap-3 rounded-card border px-3 shadow-card sm:min-w-[200px] sm:flex-none ${VARIANT_CARD[variant]}`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${VARIANT_ICON[variant]}`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
          {label}
        </span>
        <span className="truncate text-xs font-medium text-brand-ink-soft">
          {hint ?? value}
        </span>
      </div>
      <span
        className={`grid h-7 min-w-[32px] place-items-center rounded-full px-2 text-xs font-bold tabular-nums ${VARIANT_BADGE[variant]}`}
      >
        {value}
      </span>
    </div>
  );
}
