import { useState, type ReactNode } from 'react';
import { CarLegendIcon, LocalPinLegendIcon } from '../ui/icons';

type LegendKind = 'veiculo' | 'local' | 'posicao';

interface LegendItem {
  kind: LegendKind;
  color: string;
  label: string;
}

const VEICULOS: LegendItem[] = [
  { kind: 'veiculo', color: '#16a34a', label: 'Veículo com rota hoje' },
  { kind: 'veiculo', color: '#000000', label: 'Veículo sem rota' },
];

const LOCAIS: LegendItem[] = [
  { kind: 'local', color: '#000000', label: 'Sem entrada nem saída' },
  { kind: 'local', color: '#7c3aed', label: 'No local, dentro do horário' },
  { kind: 'local', color: '#1d4ed8', label: 'Chegou/saiu no prazo' },
  { kind: 'local', color: '#dc2626', label: 'Atrasado (entrada ou saída)' },
];

const POSICOES: LegendItem[] = [
  { kind: 'posicao', color: '#1d4ed8', label: 'Posição até 500 m da rota' },
  { kind: 'posicao', color: '#dc2626', label: 'Posição a mais de 500 m da rota' },
];

function LegendRow({ item }: { item: LegendItem }) {
  if (item.kind === 'posicao') {
    return (
      <li className="flex items-center gap-2 text-xs text-brand-ink">
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px] border-white drop-shadow-sm"
          style={{ backgroundColor: item.color }}
          aria-hidden
        />
        <span>{item.label}</span>
      </li>
    );
  }
  const Icon = item.kind === 'veiculo' ? CarLegendIcon : LocalPinLegendIcon;
  return (
    <li className="flex items-center gap-2 text-xs text-brand-ink">
      <Icon color={item.color} className="h-4 w-4 shrink-0 drop-shadow-sm" />
      <span>{item.label}</span>
    </li>
  );
}

function LegendGroup({ title, items }: { title: string; items: LegendItem[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
        {title}
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <LegendRow key={item.label} item={item} />
        ))}
      </ul>
    </div>
  );
}

interface MapLegendProps {
  extra?: ReactNode;
}

export function MapLegend({ extra }: MapLegendProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
      {open && (
        <div className="pointer-events-auto rounded-card border border-brand-line bg-white p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
              Legenda
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-brand-ink-muted transition-colors hover:bg-brand-line-soft hover:text-brand-ink-soft"
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
            <LegendGroup title="Posições" items={POSICOES} />
          </div>
        </div>
      )}

      <div className="pointer-events-auto flex flex-row flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-pressed={open}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-card transition-colors ${
            open
              ? 'border-brand-ink-soft bg-brand-ink text-white hover:bg-brand-ink-soft'
              : 'border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Legenda
        </button>
        {extra}
      </div>
    </div>
  );
}
