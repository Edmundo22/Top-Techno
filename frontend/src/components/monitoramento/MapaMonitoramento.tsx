import { useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { LocalDia, Rota, Veiculo } from '../../services/monitoramentoApi';
import { LocalMarker } from './LocalMarker';
import { RotaPolyline } from './RotaPolyline';
import { VeiculoMarker } from './VeiculoMarker';

const DEFAULT_CENTER = { lat: -14.235, lng: -51.9253 };
const DEFAULT_ZOOM = 5;

const MAP_LIBRARIES: ('geometry')[] = ['geometry'];

const containerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
};

interface MapaMonitoramentoProps {
  veiculos: Veiculo[];
  rotas: Rota[];
  locais: LocalDia[];
  showRotas: boolean;
  showLocais: boolean;
}

export function MapaMonitoramento({
  veiculos,
  rotas,
  locais,
  showRotas,
  showLocais,
}: MapaMonitoramentoProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const fittedRef = useRef(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    fittedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || fittedRef.current) return;
    const points: google.maps.LatLngLiteral[] = veiculos
      .filter((v): v is Veiculo & { latitude: number; longitude: number } =>
        v.latitude != null && v.longitude != null,
      )
      .map((v) => ({ lat: v.latitude, lng: v.longitude }));
    if (points.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 80);
    fittedRef.current = true;
  }, [isLoaded, veiculos]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        VITE_GOOGLE_MAPS_API_KEY não configurada no frontend/.env
      </div>
    );
  }

  if (loadError) {
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
        mapContainerStyle={containerStyle}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {showRotas &&
          rotas.map((r) => <RotaPolyline key={`rota-${r.idViagem}`} data={r} />)}

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
