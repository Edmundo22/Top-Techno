import { useEffect } from 'react';
import { PoiIcon, EyeIcon, EyeOffIcon } from './icons';

// Styles aplicados ao mapa para esconder POIs (shoppings, hospitais, escolas...).
// Mantemos labels visíveis — o usuário só quer apagar os ícones desses pontos.
const POI_HIDDEN_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

interface MapPoiToggleProps {
  map: google.maps.Map | null;
  show: boolean;
  onToggle: () => void;
  /** Offset horizontal extra quando há outra pílula no canto (ex.: a legenda). */
  className?: string;
}

export function MapPoiToggle({ map, show, onToggle, className = '' }: MapPoiToggleProps) {
  useEffect(() => {
    if (!map) return;
    map.setOptions({ styles: show ? null : POI_HIDDEN_STYLES });
  }, [map, show]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!show}
      className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-[11px] font-semibold shadow-card backdrop-blur transition-colors ${
        show
          ? 'border-brand-line text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
          : 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
      } ${className}`}
      title={show ? 'Desativar referências do mapa' : 'Ativar referências do mapa'}
    >
      <PoiIcon className="h-3.5 w-3.5" />
      {show ? (
        <>
          <EyeOffIcon className="h-3.5 w-3.5" />
          <span>Desativar referências</span>
        </>
      ) : (
        <>
          <EyeIcon className="h-3.5 w-3.5" />
          <span>Ativar referências</span>
        </>
      )}
    </button>
  );
}
