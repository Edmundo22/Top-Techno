import type { ReactNode } from 'react';
import { BuildingIcon, HexIcon, LayersIcon } from '../../ui/icons';
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
    <div className="flex h-12 min-w-[170px] items-center gap-3 rounded-card border border-brand-line bg-white px-3 shadow-card transition-colors hover:border-brand-line-strong">
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
  const totalPoligonos = locais.filter((l) => !!l.poligonoWkt).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatCard
        icon={<BuildingIcon className="h-4 w-4" />}
        label="Total de locais"
        value={total}
      />
      <StatCard
        icon={<HexIcon className="h-4 w-4" />}
        label="Polígonos cadastrados"
        value={totalPoligonos}
        hint={total > 0 ? `${Math.round((totalPoligonos / total) * 100)}% do total` : undefined}
      />
    </div>
  );
}

interface ShowAllPoligonosCardProps {
  active: boolean;
  onToggle: () => void;
}

export function ShowAllPoligonosCard({ active, onToggle }: ShowAllPoligonosCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title="Mostra todos os polígonos no mapa, em verde"
      className={`flex h-12 min-w-[200px] items-center gap-3 rounded-card border px-3 text-left shadow-card transition-colors ${
        active
          ? 'border-green-600 bg-green-50 hover:bg-green-100'
          : 'border-brand-line bg-white hover:border-brand-ink-soft hover:bg-brand-line-soft'
      }`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
          active ? 'bg-green-600 text-white' : 'bg-brand-line-soft text-brand-ink-soft'
        }`}
      >
        <LayersIcon className="h-4 w-4" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink-muted">
          Camada no mapa
        </span>
        <span className="truncate text-sm font-semibold text-brand-ink">
          {active ? 'Ocultar polígonos' : 'Mostrar todos os polígonos'}
        </span>
      </div>
    </button>
  );
}
