import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MAP_LIBRARIES } from '../../../services/googleMaps';
import { logError } from '../../../utils/logger';

const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };
const ROUTE_COLOR = '#1d4ed8';
const containerStyle = { width: '100%', height: '100%' };

interface MapaRotaProps {
  polyline: string | null;
}

// Mini-mapa que plota o traçado (POLYLINE encoded) de uma única rota. Padrão
// imperativo: polyline criada via new google.maps.Polyline em ref, com cleanup
// setMap(null). fitBounds enquadra a rota a cada troca.
export function MapaRota({ polyline }: MapaRotaProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // O controle de tela cheia do Google usa a Fullscreen API do browser. Quando
  // o mapa entra em tela cheia, liberamos todos os controles padrão; no modo
  // pequeno fica só o botão de expandir.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!map) return;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (!polyline) return;

    let path: google.maps.LatLng[];
    try {
      path = google.maps.geometry.encoding.decodePath(polyline);
    } catch (err) {
      logError('decodePath rota mini-mapa', err);
      return;
    }
    if (path.length === 0) return;

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: false,
      strokeColor: ROUTE_COLOR,
      strokeOpacity: 0.9,
      strokeWeight: 4,
      clickable: false,
      map,
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    return () => {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
    };
  }, [map, polyline]);

  if (!apiKey) {
    return (
      <div className="grid h-full place-items-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        VITE_GOOGLE_MAPS_API_KEY não configurada
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid h-full place-items-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        Falha ao carregar Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="grid h-full place-items-center rounded-card border border-brand-line bg-brand-line-soft text-xs text-brand-ink-muted">
        Carregando mapa…
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-card border border-brand-line bg-white">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={SAO_PAULO_CENTER}
        zoom={14}
        options={
          isFullscreen
            ? {
                // Tela cheia: todos os controles padrão do Google Maps.
                streetViewControl: true,
                zoomControl: true,
                fullscreenControl: true,
                mapTypeControl: true,
                rotateControl: true,
                scaleControl: true,
                clickableIcons: true,
                gestureHandling: 'greedy',
              }
            : {
                // Modo pequeno: sem +/- de zoom; Street View + botão de tela cheia (inf. dir.).
                streetViewControl: true,
                zoomControl: false,
                fullscreenControl: true,
                fullscreenControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_BOTTOM,
                },
                mapTypeControl: false,
                clickableIcons: false,
                gestureHandling: 'greedy',
              }
        }
        onLoad={(m) => setMap(m)}
        onUnmount={() => setMap(null)}
      />
    </div>
  );
}
