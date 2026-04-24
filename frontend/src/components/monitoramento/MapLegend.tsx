import { useState } from 'react';

interface LegendItem {
  color: string;
  label: string;
}

const VEICULOS: LegendItem[] = [
  { color: '#16a34a', label: 'Veículo com viagem do dia' },
  { color: '#000000', label: 'Veículo sem viagem' },
];

const LOCAIS: LegendItem[] = [
  { color: '#000000', label: 'Sem entrada nem saída' },
  { color: '#7c3aed', label: 'No local, dentro do horário' },
  { color: '#1d4ed8', label: 'Chegou/saiu no prazo' },
  { color: '#dc2626', label: 'Atrasado (entrada ou saída)' },
];

function LegendGroup({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
        {title}
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-xs text-brand-ink"
          >
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
  );
}

export function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
      {open && (
        <div className="rounded-card border border-brand-line bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
              Legenda
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
          <div className="flex flex-col gap-3">
            <LegendGroup title="Veículos" items={VEICULOS} />
            <LegendGroup title="Locais" items={LOCAIS} />
          </div>
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
