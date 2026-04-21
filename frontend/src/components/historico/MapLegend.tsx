import { useState } from 'react';

const ITEMS: { color: string; label: string }[] = [
  { color: '#16a34a', label: 'Em rota (DIST_ROTA < 50 m)' },
  { color: '#dc2626', label: 'Fora da rota (DIST_ROTA ≥ 50 m)' },
  { color: '#7c3aed', label: 'Ignição desligada (prioridade)' },
];

export function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      {open && (
        <div className="rounded-card border border-brand-line bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
              Legenda — ícones de posição
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-brand-ink-muted transition-colors hover:bg-brand-line-soft hover:text-brand-ink"
              aria-label="Fechar legenda"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {ITEMS.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-xs text-brand-ink">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink shadow-card transition-colors hover:bg-brand-line-soft"
        >
          Legenda
        </button>
      )}
    </div>
  );
}
