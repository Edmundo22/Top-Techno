import type { ReactNode } from 'react';

type ActiveVariant = 'green' | 'slate' | 'accent';

interface StatToggleCardProps {
  icon: ReactNode;
  label: string;
  count: number;
  active: boolean;
  onToggle: () => void;
  variant?: ActiveVariant;
  title?: string;
}

const ACTIVE_VARIANTS: Record<ActiveVariant, string> = {
  green: 'border-green-600 bg-green-50 text-green-900 hover:bg-green-100',
  slate: 'border-brand-ink-soft bg-brand-ink text-white hover:bg-brand-ink-soft',
  accent: 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover',
};

const ACTIVE_BADGE: Record<ActiveVariant, string> = {
  green: 'bg-green-600 text-white',
  slate: 'bg-brand-accent text-brand-ink',
  accent: 'bg-brand-ink text-white',
};

const ACTIVE_ICON: Record<ActiveVariant, string> = {
  green: 'bg-green-100 text-green-700',
  slate: 'bg-white/15 text-white',
  accent: 'bg-white/40 text-brand-ink',
};

export function StatToggleCard({
  icon,
  label,
  count,
  active,
  onToggle,
  variant = 'green',
  title,
}: StatToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={title}
      className={`flex h-12 min-w-[200px] items-center gap-3 rounded-card border px-3 text-left shadow-card transition-colors ${
        active
          ? ACTIVE_VARIANTS[variant]
          : 'border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
      }`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
          active ? ACTIVE_ICON[variant] : 'bg-brand-line-soft text-brand-ink-soft'
        }`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span
          className={`truncate text-[10px] font-semibold uppercase tracking-wider ${
            active ? 'opacity-80' : 'text-brand-ink-muted'
          }`}
        >
          {label}
        </span>
        <span className="truncate text-xs font-medium">
          {active ? 'Visíveis no mapa' : 'Ocultos no mapa'}
        </span>
      </div>
      <span
        className={`grid h-7 min-w-[32px] place-items-center rounded-full px-2 text-xs font-bold tabular-nums ${
          active ? ACTIVE_BADGE[variant] : 'bg-brand-line-soft text-brand-ink'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
