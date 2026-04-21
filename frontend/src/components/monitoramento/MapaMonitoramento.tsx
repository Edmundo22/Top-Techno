import { useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { LocalDia, Rota, Veiculo } from '../../services/monitoramentoApi';
import { logError, logSuccess } from '../../utils/logger';
import { LocalMarker } from './LocalMarker';
import { RotaLayer } from './RotaLayer';
import { VeiculoMarker } from './VeiculoMarker';

const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };
const DEFAULT_ZOOM = 12;

const MAP_LIBRARIES: ('geometry')[] = ['geometry'];

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface MapaMonitoramentoProps {
  veiculos: Veiculo[];
  rotas: Rota[];
  locais: LocalDia[];
  showRotas: boolean;
  showLocais: boolean;
  selectedViagemId: number | null;
  onSelectViagem: (idViagem: number | null) => void;
  resetKey: number;
}

export function MapaMonitoramento({
  veiculos,
  rotas,
  locais,
  showRotas,
  showLocais,
  selectedViagemId,
  onSelectViagem,
  resetKey,
}: MapaMonitoramentoProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const mapOptions: google.maps.MapOptions = {
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    mapTypeControl: true,
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.TERRAIN,
          ],
        }
      : undefined,
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    logSuccess('GoogleMap carregado', { center: SAO_PAULO_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        VITE_GOOGLE_MAPS_API_KEY não configurada no frontend/.env
      </div>
    );
  }

  if (loadError) {
    logError('Falha ao carregar Google Maps', loadError);
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        Falha ao carregar Google Maps: {String(loadError.message ?? loadError)}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-brand-line bg-brand-line-soft text-xs text-brand-ink-muted">
        Carregando mapa…
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-card border border-brand-line bg-white shadow-card">
      <GoogleMap
        key={resetKey}
        mapContainerStyle={containerStyle}
        center={SAO_PAULO_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {showRotas &&
          rotas.map((r) => (
            <RotaLayer
              key={`rota-${r.idViagem}`}
              data={r}
              selected={selectedViagemId === r.idViagem}
              onSelect={() => onSelectViagem(r.idViagem)}
            />
          ))}

        {showLocais &&
          locais.map((l) => (
            <LocalMarker key={`local-${l.idViagemEntrada}`} data={l} />
          ))}

        {veiculos.map((v) => (
          <VeiculoMarker key={`veic-${v.idVeiculo}`} data={v} />
        ))}
      </GoogleMap>
    </div>
  );
}
