import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MAP_LIBRARIES } from '../../services/googleMaps';
import type {
  LocalHistorico,
  Posicao,
  RotaHistorico,
} from '../../services/historicoApi';
import { formatBRDateTimeFull } from '../../utils/datetime';
import { logError, logSuccess } from '../../utils/logger';
import { MapPoiToggle } from '../ui/MapPoiToggle';
import { MapLegend } from './MapLegend';

const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };
const DEFAULT_ZOOM = 12;
const ROUTE_COLOR = '#1d4ed8';

const COLOR_ROTA_OK = '#16a34a';
const COLOR_ROTA_FORA = '#dc2626';
const COLOR_IGNICAO_OFF = '#7c3aed';

const DIST_ROTA_THRESHOLD = 50;

const CAR_PATH =
  'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z';

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface MapaHistoricoProps {
  posicoes: Posicao[];
  rotas: RotaHistorico[];
  locais: LocalHistorico[];
  showPosicoes: boolean;
  showRotas: boolean;
  showLocais: boolean;
}

function pickPosicaoColor(p: Posicao): string {
  if (p.ignicaoOn === false) return COLOR_IGNICAO_OFF;
  if (p.distRota != null && p.distRota < DIST_ROTA_THRESHOLD) return COLOR_ROTA_OK;
  return COLOR_ROTA_FORA;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDist(dist: number | null): string {
  if (dist == null) return '—';
  return `${dist.toFixed(2)} m`;
}

function formatMinutos(min: number | null): string {
  if (min == null) return '—';
  return `${min} min`;
}

function offsetPosition(
  base: google.maps.LatLngLiteral,
  index: number,
  total: number,
): google.maps.LatLngLiteral {
  if (index === 0 || total <= 1) return base;
  const radiusMeters = 14;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((base.lat * Math.PI) / 180);
  const angle = ((index - 1) / Math.max(total - 1, 1)) * 2 * Math.PI;
  return {
    lat: base.lat + (radiusMeters * Math.sin(angle)) / metersPerDegLat,
    lng: base.lng + (radiusMeters * Math.cos(angle)) / metersPerDegLng,
  };
}

export function MapaHistorico({
  posicoes,
  rotas,
  locais,
  showPosicoes,
  showRotas,
  showLocais,
}: MapaHistoricoProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showPois, setShowPois] = useState(true);

  const rotaPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const posMarkersRef = useRef<google.maps.Marker[]>([]);
  const posInfoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const localMarkersRef = useRef<google.maps.Marker[]>([]);
  const localInfoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const localCirclesRef = useRef<google.maps.Circle[]>([]);

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
    logSuccess('MapaHistorico carregado', { center: SAO_PAULO_CENTER, zoom: DEFAULT_ZOOM });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!map) return;

    rotaPolylinesRef.current.forEach((p) => p.setMap(null));
    rotaPolylinesRef.current = [];

    if (!showRotas) return;

    rotas.forEach((rota) => {
      let path: google.maps.LatLng[];
      try {
        path = google.maps.geometry.encoding.decodePath(rota.polyline);
      } catch (err) {
        logError('decodePath rota histórico', err, { idViagem: rota.idViagem });
        return;
      }
      if (path.length === 0) return;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: false,
        strokeColor: ROUTE_COLOR,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        clickable: false,
        zIndex: 5,
        map,
      });
      rotaPolylinesRef.current.push(polyline);
    });

    logSuccess('rotas histórico renderizadas', { total: rotas.length });

    return () => {
      rotaPolylinesRef.current.forEach((p) => p.setMap(null));
      rotaPolylinesRef.current = [];
    };
  }, [map, showRotas, rotas]);

  useEffect(() => {
    if (!map) return;

    posInfoWindowsRef.current.forEach((iw) => iw.close());
    posMarkersRef.current.forEach((m) => m.setMap(null));
    posInfoWindowsRef.current = [];
    posMarkersRef.current = [];

    if (!showPosicoes) return;

    posicoes.forEach((pos) => {
      if (pos.latitude == null || pos.longitude == null) return;

      const color = pickPosicaoColor(pos);

      const marker = new google.maps.Marker({
        position: { lat: pos.latitude, lng: pos.longitude },
        map,
        icon: {
          path: CAR_PATH,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: color,
          strokeWeight: 1,
          scale: 1.2,
          anchor: new google.maps.Point(12, 12),
        },
        zIndex: 20,
      });

      const placa = escapeHtml(pos.placa ?? 'Sem placa');
      const content = `
        <div style="min-width:220px;font-size:12px;color:#1F2937">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${placa}</div>
          <div><span style="color:#6B7280">Data/hora: </span>${escapeHtml(formatBRDateTimeFull(pos.dtPosicao))}</div>
          <div><span style="color:#6B7280">Velocidade: </span>${pos.velocidade != null ? `${pos.velocidade} km/h` : '—'}</div>
          <div><span style="color:#6B7280">Ignição: </span>${escapeHtml(pos.ignicao ?? '—')}</div>
          <div><span style="color:#6B7280">Dist. rota: </span>${formatDist(pos.distRota)}</div>
          <div><span style="color:#6B7280">Ponto de parada: </span>${escapeHtml(pos.pontoParada ?? '—')}</div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content,
        pixelOffset: new google.maps.Size(0, -18),
      });

      marker.addListener('click', () => {
        posInfoWindowsRef.current.forEach((iw) => iw.close());
        infoWindow.open({ map, anchor: marker });
      });

      posMarkersRef.current.push(marker);
      posInfoWindowsRef.current.push(infoWindow);
    });

    logSuccess('posições histórico renderizadas', { total: posicoes.length });

    return () => {
      posInfoWindowsRef.current.forEach((iw) => iw.close());
      posMarkersRef.current.forEach((m) => m.setMap(null));
      posInfoWindowsRef.current = [];
      posMarkersRef.current = [];
    };
  }, [map, showPosicoes, posicoes]);

  useEffect(() => {
    if (!map) return;

    localInfoWindowsRef.current.forEach((iw) => iw.close());
    localMarkersRef.current.forEach((m) => m.setMap(null));
    localCirclesRef.current.forEach((c) => c.setMap(null));
    localInfoWindowsRef.current = [];
    localMarkersRef.current = [];
    localCirclesRef.current = [];

    if (!showLocais) return;

    const counts = new Map<number, number>();
    const totals = new Map<number, number>();
    locais.forEach((l) => {
      totals.set(l.idLocal, (totals.get(l.idLocal) ?? 0) + 1);
    });

    locais.forEach((local) => {
      if (local.latitude == null || local.longitude == null) return;

      const occurrenceIndex = counts.get(local.idLocal) ?? 0;
      counts.set(local.idLocal, occurrenceIndex + 1);
      const total = totals.get(local.idLocal) ?? 1;

      const position = offsetPosition(
        { lat: local.latitude, lng: local.longitude },
        occurrenceIndex,
        total,
      );

      const marker = new google.maps.Marker({
        position,
        map,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
          fillColor: '#000000',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new google.maps.Point(12, 22),
        },
        zIndex: 10,
      });

      const circleIndex = localCirclesRef.current.length;
      const circle = new google.maps.Circle({
        center: { lat: local.latitude, lng: local.longitude },
        radius: local.raio ?? 0,
        map: null,
        fillColor: '#000000',
        fillOpacity: 0.75,
        strokeColor: '#000000',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        clickable: false,
      });
      localCirclesRef.current.push(circle);

      const placa = escapeHtml(local.placa ?? 'Sem placa');
      const pontoParada = escapeHtml(local.pontoParada ?? '—');
      const endereco = escapeHtml(local.endereco ?? 'Sem endereço');
      const buttonId = `hist-raio-${local.idHistorico}`;
      const raioDisponivel = local.raio != null && local.raio > 0;
      const raioBtnLabel = raioDisponivel
        ? `Mostrar raio (${local.raio} m)`
        : 'Raio indisponível';

      const content = `
        <div style="min-width:240px;max-width:300px;font-size:12px;color:#1F2937">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${endereco}</div>
          <div><span style="color:#6B7280">Ponto de parada: </span>${pontoParada}</div>
          <div><span style="color:#6B7280">Placa: </span>${placa}</div>
          <div><span style="color:#6B7280">Entrada: </span>${escapeHtml(formatBRDateTimeFull(local.dtEntrada))}</div>
          <div><span style="color:#6B7280">Saída: </span>${escapeHtml(formatBRDateTimeFull(local.dtSaida))}</div>
          <div><span style="color:#6B7280">Permanência: </span>${formatMinutos(local.tempoPermanenciaMin)}</div>
          <button
            id="${buttonId}"
            type="button"
            ${raioDisponivel ? '' : 'disabled'}
            data-circle-index="${circleIndex}"
            style="margin-top:8px;width:100%;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:600;
                   border:1px solid #E5E7EB;background:#fff;color:#1F2937;cursor:${raioDisponivel ? 'pointer' : 'not-allowed'};"
          >${escapeHtml(raioBtnLabel)}</button>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content,
        pixelOffset: new google.maps.Size(0, -14),
      });

      const updateButtonVisual = (btn: HTMLButtonElement, visible: boolean) => {
        if (!raioDisponivel) return;
        if (visible) {
          btn.style.background = '#b4e7ff';
          btn.style.borderColor = '#b4e7ff';
          btn.textContent = `Ocultar raio (${local.raio} m)`;
        } else {
          btn.style.background = '#fff';
          btn.style.borderColor = '#E5E7EB';
          btn.textContent = `Mostrar raio (${local.raio} m)`;
        }
      };

      infoWindow.addListener('domready', () => {
        const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
        if (!btn) return;
        const idxAttr = btn.getAttribute('data-circle-index');
        if (idxAttr == null) return;
        const idx = Number(idxAttr);
        const target = localCirclesRef.current[idx];
        if (!target) return;
        updateButtonVisual(btn, target.getMap() != null);
        btn.onclick = () => {
          const visible = target.getMap() != null;
          target.setMap(visible ? null : map);
          updateButtonVisual(btn, !visible);
        };
      });

      marker.addListener('click', () => {
        localInfoWindowsRef.current.forEach((iw) => iw.close());
        infoWindow.open({ map, anchor: marker });
      });

      localMarkersRef.current.push(marker);
      localInfoWindowsRef.current.push(infoWindow);
    });

    logSuccess('locais histórico renderizados', { total: locais.length });

    return () => {
      localInfoWindowsRef.current.forEach((iw) => iw.close());
      localMarkersRef.current.forEach((m) => m.setMap(null));
      localCirclesRef.current.forEach((c) => c.setMap(null));
      localInfoWindowsRef.current = [];
      localMarkersRef.current = [];
      localCirclesRef.current = [];
    };
  }, [map, showLocais, locais]);

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
      />
      <MapLegend
        extra={
          <MapPoiToggle map={map} show={showPois} onToggle={() => setShowPois((v) => !v)} />
        }
      />
    </div>
  );
}
