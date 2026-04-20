interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  disabled?: boolean;
}

export function ToggleChip({ active, onClick, label, count, disabled }: ToggleChipProps) {
  const base =
    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const on =
    'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover';
  const off =
    'border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-line-soft';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${base} ${active ? on : off}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-brand-ink' : 'bg-brand-line'}`}
        aria-hidden
      />
      {label}
      {typeof count === 'number' && (
        <span
          className={`ml-1 rounded-full px-1.5 py-px text-[10px] font-semibold ${
            active ? 'bg-brand-ink text-white' : 'bg-brand-line-soft text-brand-ink-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
