import { RouteIcon } from '../ui/icons';

interface LinhasFilterCardProps {
  linhas: string[];
  selectedLinhas: string[];
  onToggleLinha: (linha: string) => void;
}

export function LinhasFilterCard({
  linhas,
  selectedLinhas,
  onToggleLinha,
}: LinhasFilterCardProps) {
  return (
    <section className="flex min-h-0 flex-col gap-2 rounded-card border border-brand-line bg-white p-2 shadow-card">
      <header className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-soft">
          <RouteIcon className="h-3.5 w-3.5" />
          Linhas
        </span>
        <span className="rounded-full bg-brand-line-soft px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
          {linhas.length}
        </span>
      </header>
      <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
        {linhas.length === 0 ? (
          <span className="px-1 py-2 text-[11px] text-brand-ink-muted">
            Nenhuma linha
          </span>
        ) : (
          linhas.map((linha) => {
            const active = selectedLinhas.includes(linha);
            return (
              <button
                key={linha}
                type="button"
                onClick={() => onToggleLinha(linha)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                  active
                    ? 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                    : 'border-brand-line bg-brand-surface text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
                }`}
              >
                {linha}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
