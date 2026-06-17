import type { ReactNode } from 'react';
import { BuildingIcon, CircleIcon, HexIcon } from '../../ui/icons';
import type { LocalDTO } from '../../../services/locaisApi';

interface StatsCardsProps {
  locais: LocalDTO[];
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
}

function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <div className="flex h-12 min-w-[150px] items-center gap-3 rounded-card border border-brand-line bg-white px-3 shadow-card transition-colors hover:border-brand-line-strong">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-line-soft text-brand-ink-soft">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
          {label}
        </span>
        <span className="truncate text-sm font-semibold text-brand-ink">{value}</span>
        {hint && <span className="text-[10px] text-brand-ink-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function StatsCards({ locais }: StatsCardsProps) {
  const total = locais.length;
  const circulos = locais.filter((l) => l.tipoLocal === 1).length;
  const poligonos = locais.filter((l) => l.tipoLocal === 2).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatCard
        icon={<BuildingIcon className="h-4 w-4" />}
        label="Total de locais"
        value={total}
      />
      <StatCard icon={<CircleIcon className="h-4 w-4" />} label="Círculos" value={circulos} />
      <StatCard icon={<HexIcon className="h-4 w-4" />} label="Polígonos" value={poligonos} />
    </div>
  );
}
