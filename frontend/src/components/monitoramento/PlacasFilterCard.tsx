import { CarIcon } from '../ui/icons';

interface PlacasFilterCardProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
}

export function PlacasFilterCard({
  placas,
  selectedPlacas,
  onTogglePlaca,
}: PlacasFilterCardProps) {
  return (
    <section className="flex h-full min-h-0 flex-col gap-2 rounded-card border border-brand-line bg-white p-2 shadow-card">
      <header className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-soft">
          <CarIcon className="h-3.5 w-3.5" />
          Placas
        </span>
        <span className="rounded-full bg-brand-line-soft px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
          {placas.length}
        </span>
      </header>
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
        {placas.length === 0 ? (
          <span className="px-1 py-2 text-[11px] text-brand-ink-muted">
            Nenhuma placa
          </span>
        ) : (
          placas.map((placa) => {
            const active = selectedPlacas.includes(placa);
            return (
              <button
                key={placa}
                type="button"
                onClick={() => onTogglePlaca(placa)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                  active
                    ? 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                    : 'border-brand-line bg-brand-surface text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
                }`}
              >
                {placa}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
