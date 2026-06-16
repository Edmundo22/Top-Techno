import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MAP_LIBRARIES } from '../../../services/googleMaps';
import type { LocalDTO } from '../../../services/locaisApi';
import { centroidOf, parseWktPolygon } from '../../../utils/wkt';
import { logError } from '../../../utils/logger';
import { MapPoiToggle } from '../../ui/MapPoiToggle';

const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };
const DEFAULT_ZOOM = 12;
const ACTIVE_COLOR = '#dc2626';
const ALL_POLY_COLOR = '#16a34a';
const FILL_OPACITY = 0.75;

const containerStyle = { width: '100%', height: '100%' };

interface MapaCadastroLocaisProps {
  locais: LocalDTO[];
  activeMarkerId: number | null;
  activePoligonoId: number | null;
  showAllPoligonos: boolean;
}

function infoHtml(local: LocalDTO): string {
  const rows = [
    ['Código', local.codigoPonto ?? '-'],
    ['Endereço', local.endereco ?? '-'],
    ['Latitude', local.latitude != null ? String(local.latitude) : '-'],
    ['Longitude', local.longitude != null ? String(local.longitude) : '-'],
    ['Raio (m)', local.raio != null ? String(local.raio) : '-'],
    ['Ponto de Parada', local.pontoParada ?? '-'],
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;gap:6px;margin-top:2px"><span style="color:#6B7280">${k}:</span><span>${escapeHtml(
          v,
        )}</span></div>`,
    )
    .join('');
  return `<div style="min-width:200px;font-size:12px;color:#1F2937">${body}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function MapaCadastroLocais({
  locais,
  activeMarkerId,
  activePoligonoId,
  showAllPoligonos,
}: MapaCadastroLocaisProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showPois, setShowPois] = useState(true);

  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const allPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const allPolygonsInfoRef = useRef<google.maps.InfoWindow | null>(null);

  const clearMarker = useCallback(() => {
    markerRef.current?.setMap(null);
    circleRef.current?.setMap(null);
    markerRef.current = null;
    circleRef.current = null;
  }, []);

  const clearPolygon = useCallback(() => {
    polygonRef.current?.setMap(null);
    polygonRef.current = null;
  }, []);

  const closeInfo = useCallback(() => {
    infoWindowRef.current?.close();
  }, []);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    if (!map) return;
    clearMarker();
    closeInfo();
    if (activeMarkerId == null) return;
    const local = locais.find((l) => l.idLocal === activeMarkerId);
    if (!local || local.latitude == null || local.longitude == null) return;
    const position = { lat: local.latitude, lng: local.longitude };
    const marker = new google.maps.Marker({
      map,
      position,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: ACTIVE_COLOR,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 50,
    });
    const circle = new google.maps.Circle({
      map,
      center: position,
      radius: local.raio ?? 0,
      strokeColor: ACTIVE_COLOR,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: ACTIVE_COLOR,
      fillOpacity: FILL_OPACITY,
      clickable: false,
    });
    const info = new google.maps.InfoWindow({ content: infoHtml(local) });
    marker.addListener('click', () => {
      infoWindowRef.current?.close();
      info.open({ map, anchor: marker });
      infoWindowRef.current = info;
    });
    markerRef.current = marker;
    circleRef.current = circle;
    map.panTo(position);
    return () => {
      clearMarker();
    };
  }, [map, activeMarkerId, locais, clearMarker, closeInfo]);

  useEffect(() => {
    if (!map) return;
    clearPolygon();
    if (activePoligonoId == null) return;
    const local = locais.find((l) => l.idLocal === activePoligonoId);
    if (!local?.poligonoWkt) return;
    let path: { lat: number; lng: number }[];
    try {
      path = parseWktPolygon(local.poligonoWkt);
    } catch (err) {
      logError('parseWktPolygon ativo', err, { idLocal: local.idLocal });
      return;
    }
    const polygon = new google.maps.Polygon({
      map,
      paths: path,
      strokeColor: ACTIVE_COLOR,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: ACTIVE_COLOR,
      fillOpacity: FILL_OPACITY,
      clickable: true,
      zIndex: 30,
    });
    const info = new google.maps.InfoWindow({
      content: infoHtml(local),
      position: centroidOf(path),
    });
    polygon.addListener('click', () => {
      infoWindowRef.current?.close();
      info.open({ map });
      infoWindowRef.current = info;
    });
    polygonRef.current = polygon;
    if (path.length > 0) map.panTo(centroidOf(path));
    return () => {
      clearPolygon();
    };
  }, [map, activePoligonoId, locais, clearPolygon]);

  // Camada "Todos os polígonos" — não conflita com o polígono ativo (vermelho)
  // pois usa cor verde e zIndex menor.
  useEffect(() => {
    if (!map) return;
    allPolygonsInfoRef.current?.close();
    allPolygonsRef.current.forEach((p) => p.setMap(null));
    allPolygonsRef.current = [];
    if (!showAllPoligonos) return;
    locais
      .filter((l) => l.poligonoWkt && l.idLocal !== activePoligonoId)
      .forEach((local) => {
        let path: { lat: number; lng: number }[];
        try {
          path = parseWktPolygon(local.poligonoWkt as string);
        } catch (err) {
          logError('parseWktPolygon todos', err, { idLocal: local.idLocal });
          return;
        }
        const polygon = new google.maps.Polygon({
          map,
          paths: path,
          strokeColor: ALL_POLY_COLOR,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: ALL_POLY_COLOR,
          fillOpacity: FILL_OPACITY,
          clickable: true,
          zIndex: 15,
        });
        polygon.addListener('click', () => {
          allPolygonsInfoRef.current?.close();
          const iw = new google.maps.InfoWindow({
            content: infoHtml(local),
            position: centroidOf(path),
          });
          iw.open({ map });
          allPolygonsInfoRef.current = iw;
        });
        allPolygonsRef.current.push(polygon);
      });
    return () => {
      allPolygonsInfoRef.current?.close();
      allPolygonsRef.current.forEach((p) => p.setMap(null));
      allPolygonsRef.current = [];
    };
  }, [map, showAllPoligonos, locais, activePoligonoId]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-card border border-red-200 bg-red-50 text-xs text-red-700">
        VITE_GOOGLE_MAPS_API_KEY não configurada
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
    <div className="relative h-full w-full overflow-hidden rounded-card border border-brand-line bg-white shadow-card">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={SAO_PAULO_CENTER}
        zoom={DEFAULT_ZOOM}
        options={{
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          mapTypeControl: true,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-10">
        <MapPoiToggle map={map} show={showPois} onToggle={() => setShowPois((v) => !v)} />
      </div>
    </div>
  );
}
