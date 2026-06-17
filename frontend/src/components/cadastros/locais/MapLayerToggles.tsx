import type { ComponentType, SVGProps } from 'react';
import { CircleIcon, HexIcon, LayersIcon } from '../../ui/icons';

// Camada ativa do mapa de cadastro. Mutuamente exclusiva: 'all' = círculos + polígonos.
export type MapLayer = 'none' | 'circles' | 'polygons' | 'all';

interface MapLayerTogglesProps {
  value: MapLayer;
  onChange: (value: MapLayer) => void;
  variant?: 'card' | 'chip';
}

type Layer = Exclude<MapLayer, 'none'>;

const OPTIONS: Array<{
  key: Layer;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { key: 'circles', label: 'Todos os Círculos', Icon: CircleIcon },
  { key: 'polygons', label: 'Todos os Polígonos', Icon: HexIcon },
  { key: 'all', label: 'Todos os Locais', Icon: LayersIcon },
];

const BUTTON_BASE =
  'inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors';
const ACTIVE = 'border border-green-600 bg-green-50 text-green-800 hover:bg-green-100';
const INACTIVE =
  'border border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line';

export function MapLayerToggles({ value, onChange, variant = 'chip' }: MapLayerTogglesProps) {
  const buttons = OPTIONS.map(({ key, label, Icon }) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        // clicar no ativo desliga; clicar em outro troca a camada
        onClick={() => onChange(active ? 'none' : key)}
        aria-pressed={active}
        title={label}
        className={`${BUTTON_BASE} ${active ? ACTIVE : INACTIVE}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  });

  if (variant === 'card') {
    return (
      <div className="flex h-12 items-center gap-1 rounded-card border border-brand-line bg-white p-1 shadow-card">
        {buttons}
      </div>
    );
  }

  return <div className="flex flex-wrap items-center gap-2">{buttons}</div>;
}
