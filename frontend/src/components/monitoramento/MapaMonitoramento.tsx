import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MAP_LIBRARIES } from '../../services/googleMaps';
import type { LocalDia, Rota, Veiculo } from '../../services/monitoramentoApi';
import { MapPoiToggle } from '../ui/MapPoiToggle';
import { formatBRDateTime } from '../../utils/datetime';
import { logError, logSuccess } from '../../utils/logger';
import { LocalMarker } from './LocalMarker';
import { MapLegend } from './MapLegend';
import { VeiculoMarker } from './VeiculoMarker';

const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };
const DEFAULT_ZOOM = 12;
const ROUTE_COLOR = '#1d4ed8';
const ROUTE_COLOR_SELECTED = '#dc2626';
const ROUTE_COLOR_DIMMED = '#d1d5db';
const ENDPOINT_COLOR_DIMMED = '#9ca3af';

const COLOR_VEIC_COM_ROTA = '#16a34a';
const COLOR_VEIC_SEM_ROTA = '#000000';

// Mesma resiliência do hasRota da página: prefere o sinal `temRota` do backend,
// e cai pra `idViagem != null` se ausente, para não pintar tudo de preto quando
// o backend ainda não foi rebuildado.
const pickVeiculoColor = (v: Veiculo): string => {
  if (v.temRota === true) return COLOR_VEIC_COM_ROTA;
  if (v.temRota === false) return COLOR_VEIC_SEM_ROTA;
  return (v.idViagem ?? 0) > 0 ? COLOR_VEIC_COM_ROTA : COLOR_VEIC_SEM_ROTA;
};

// Intervalo da pulsação da polyline selecionada — alterna strokeOpacity
// entre HI e LO para chamar atenção sem distrair.
const PULSE_INTERVAL_MS = 600;
const PULSE_OPACITY_HI = 1;
const PULSE_OPACITY_LO = 0.4;

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
  /** Reporta quantos markers de local estão dentro do viewport atual. Dispara
   *  após cada `idle` do mapa e quando `locais` muda. Usado pela página para
   *  gate-ar o polling do endpoint `/monitoramento/locais`. */
  onVisibleLocaisChange?: (count: number) => void;
}

export function MapaMonitoramento({
  veiculos,
  rotas,
  locais,
  showRotas,
  showLocais,
  selectedViagemId,
  onSelectViagem,
  onVisibleLocaisChange,
}: MapaMonitoramentoProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showPois, setShowPois] = useState(true);

  const rotaPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const rotaMarkersRef = useRef<google.maps.Marker[]>([]);
  const rotaInfoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const selectedPolylineRef = useRef<google.maps.Polyline | null>(null);

  const clearRotas = useCallback(() => {
    rotaInfoWindowsRef.current.forEach((iw) => iw.close());
    rotaMarkersRef.current.forEach((m) => m.setMap(null));
    rotaPolylinesRef.current.forEach((p) => p.setMap(null));
    rotaInfoWindowsRef.current = [];
    rotaMarkersRef.current = [];
    rotaPolylinesRef.current = [];
    selectedPolylineRef.current = null;
  }, []);

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

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
    logSuccess('GoogleMap carregado', { center: SAO_PAULO_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!map) return;

    clearRotas();

    if (!showRotas) return;

    rotas.forEach((rota) => {
      let path: google.maps.LatLng[];
      try {
        path = google.maps.geometry.encoding.decodePath(rota.polyline);
      } catch (err) {
        logError('decodePath rota', err, { idViagem: rota.idViagem });
        return;
      }
      if (path.length === 0) return;

      const hasSelection = selectedViagemId != null;
      const isSelected = selectedViagemId === rota.idViagem;
      const isDimmed = hasSelection && !isSelected;

      const polylineColor = isSelected
        ? ROUTE_COLOR_SELECTED
        : isDimmed
        ? ROUTE_COLOR_DIMMED
        : ROUTE_COLOR;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: false,
        strokeColor: polylineColor,
        strokeOpacity: isSelected ? PULSE_OPACITY_HI : 0.85,
        strokeWeight: isSelected ? 6 : 4,
        clickable: true,
        zIndex: isSelected ? 8 : isDimmed ? 3 : 5,
        map,
      });
      polyline.addListener('click', () => onSelectViagem(rota.idViagem));
      rotaPolylinesRef.current.push(polyline);
      if (isSelected) selectedPolylineRef.current = polyline;

      const endpointIcon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isSelected
          ? ROUTE_COLOR_SELECTED
          : isDimmed
          ? ENDPOINT_COLOR_DIMMED
          : ROUTE_COLOR,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 7,
      };

      const makeEndpoint = (
        letter: 'I' | 'F',
        position: google.maps.LatLng,
        dateIso: string | null,
      ) => {
        const marker = new google.maps.Marker({
          position,
          map,
          icon: endpointIcon,
          label: {
            text: letter,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
          },
          zIndex: 15,
        });

        const placa = rota.placa ?? 'Sem placa';
        const label = letter === 'I' ? 'Início' : 'Fim';
        const content = `
          <div style="min-width:180px;font-size:12px;color:#1F2937">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">${placa}</div>
            <div><span style="color:#6B7280">${label}: </span>${formatBRDateTime(dateIso)}</div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
          content,
          pixelOffset: new google.maps.Size(0, -10),
        });

        marker.addListener('click', () => {
          rotaInfoWindowsRef.current.forEach((iw) => iw.close());
          infoWindow.open({ map, anchor: marker });
          onSelectViagem(rota.idViagem);
        });

        rotaMarkersRef.current.push(marker);
        rotaInfoWindowsRef.current.push(infoWindow);
      };

      makeEndpoint('I', path[0], rota.dtIniViagem);
      makeEndpoint('F', path[path.length - 1], rota.dtFimViagem);
    });

    logSuccess('rotas renderizadas', { total: rotas.length, selected: selectedViagemId });

    return () => {
      clearRotas();
    };
  }, [map, showRotas, rotas, selectedViagemId, onSelectViagem, clearRotas]);

  // Reporta a quantidade de markers de local dentro do viewport.
  // Recalcula no `idle` (Maps dispara só uma vez quando o pan/zoom termina —
  // já vem debounced). Também recalcula quando `locais` muda.
  useEffect(() => {
    if (!map || !onVisibleLocaisChange) return;
    const compute = () => {
      const bounds = map.getBounds();
      if (!bounds) {
        onVisibleLocaisChange(0);
        return;
      }
      let visible = 0;
      for (const l of locais) {
        if (l.latitude == null || l.longitude == null) continue;
        if (bounds.contains({ lat: l.latitude, lng: l.longitude })) visible++;
      }
      onVisibleLocaisChange(visible);
    };
    compute();
    const listener = map.addListener('idle', compute);
    return () => google.maps.event.removeListener(listener);
  }, [map, locais, onVisibleLocaisChange]);

  // Pulsa a polyline selecionada alternando strokeOpacity.
  // O efeito depende de selectedViagemId e da execução prévia do efeito acima
  // (que popula selectedPolylineRef). Sem polyline atribuída, sai cedo.
  useEffect(() => {
    if (selectedViagemId == null) return;
    const polyline = selectedPolylineRef.current;
    if (!polyline) return;
    let hi = true;
    const id = window.setInterval(() => {
      polyline.setOptions({
        strokeOpacity: hi ? PULSE_OPACITY_LO : PULSE_OPACITY_HI,
      });
      hi = !hi;
    }, PULSE_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      // Garante que ao desselecionar/destruir a polyline volte para 100%.
      polyline.setOptions({ strokeOpacity: PULSE_OPACITY_HI });
    };
  }, [selectedViagemId, rotas, showRotas]);

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
    <div className="relative h-full w-full overflow-hidden rounded-card border border-brand-line bg-white shadow-card">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={SAO_PAULO_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {showLocais &&
          locais.map((l) => (
            <LocalMarker key={`local-${l.idViagemEntrada}`} data={l} />
          ))}

        {veiculos.map((v) => (
          <VeiculoMarker
            key={`veic-${v.idVeiculo}`}
            data={v}
            color={pickVeiculoColor(v)}
          />
        ))}
      </GoogleMap>
      <MapLegend
        extra={
          <MapPoiToggle map={map} show={showPois} onToggle={() => setShowPois((v) => !v)} />
        }
      />
    </div>
  );
}
