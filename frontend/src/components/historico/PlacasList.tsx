interface PlacasListProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
}

export function PlacasList({ placas, selectedPlacas, onTogglePlaca }: PlacasListProps) {
  return (
    <aside className="flex w-28 shrink-0 flex-col gap-2 overflow-y-auto rounded-card border border-brand-line bg-white p-2 shadow-card">
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
        Placas
      </span>

      {placas.length === 0 ? (
        <span className="px-1 text-[11px] text-brand-ink-muted">Nenhuma placa</span>
      ) : (
        placas.map((placa) => {
          const active = selectedPlacas.includes(placa);
          return (
            <button
              key={placa}
              type="button"
              onClick={() => onTogglePlaca(placa)}
              aria-pressed={active}
              className={[
                'rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors',
                active
                  ? 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                  : 'border-brand-line bg-brand-surface text-brand-ink hover:bg-brand-line-soft',
              ].join(' ')}
            >
              {placa}
            </button>
          );
        })
      )}
    </aside>
  );
}
