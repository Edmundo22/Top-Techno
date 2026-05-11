import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { MapPoiToggle } from '../../ui/MapPoiToggle';
import { Modal } from '../../ui/Modal';
import {
  LayersIcon,
  PinIcon,
  PolygonOutlineIcon,
  TrashIcon,
} from '../../ui/icons';
import { MAP_LIBRARIES } from '../../../services/googleMaps';
import type { LocalDTO, LocalUpsertBody } from '../../../services/locaisApi';
import {
  centroidOf,
  parseWktPolygon,
  pathFromGoogleLatLngs,
  pathToWktPolygon,
  type LatLngLiteral,
} from '../../../utils/wkt';
import { logError } from '../../../utils/logger';

const NEW_COLOR = '#dc2626'; // vermelho — círculo/polígono novos
const EDIT_CIRCLE_COLOR = '#f97316'; // laranja — círculo/marker quando em edição
const OTHER_COLOR = '#16a34a'; // verde — camada "Todos os Locais"
const DRAW_BUTTON_BASE =
  'inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };

const containerStyle = { width: '100%', height: '100%' };

interface FormState {
  codigoPonto: string;
  endereco: string;
  raio: string;
  pontoParada: string;
}

interface LocalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (local: LocalDTO) => void;
  initial: LocalDTO | null;
  allLocais: LocalDTO[];
  submit: (body: LocalUpsertBody) => Promise<LocalDTO>;
}

const EMPTY_FORM: FormState = { codigoPonto: '', endereco: '', raio: '', pontoParada: '' };

function infoHtml(local: LocalDTO): string {
  const rows: Array<[string, string]> = [
    ['Código', local.codigoPonto ?? '-'],
    ['Endereço', local.endereco ?? '-'],
    ['Latitude', local.latitude != null ? String(local.latitude) : '-'],
    ['Longitude', local.longitude != null ? String(local.longitude) : '-'],
    ['Raio (m)', local.raio != null ? String(local.raio) : '-'],
    ['Ponto de Parada', local.pontoParada ?? '-'],
  ];
  return `<div style="min-width:200px;font-size:12px;color:#1F2937">${rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;gap:6px;margin-top:2px"><span style="color:#6B7280">${k}:</span><span>${escape(
          v,
        )}</span></div>`,
    )
    .join('')}</div>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function LocalFormModal({
  open,
  onClose,
  onSaved,
  initial,
  allLocais,
  submit,
}: LocalFormModalProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  });

  const isEdit = initial != null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [circleState, setCircleState] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [poligonoWkt, setPoligonoWkt] = useState<string | null>(null);
  const [showOutros, setShowOutros] = useState(false);
  const [showPois, setShowPois] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const polygonListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const outrosPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const outrosInfoRef = useRef<google.maps.InfoWindow | null>(null);

  // -------- Reset / pré-popular ao abrir
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        codigoPonto: initial.codigoPonto ?? '',
        endereco: initial.endereco ?? '',
        raio: initial.raio != null ? String(initial.raio) : '',
        pontoParada: initial.pontoParada ?? '',
      });
      if (initial.latitude != null && initial.longitude != null) {
        setCircleState({ lat: initial.latitude, lng: initial.longitude });
      } else {
        setCircleState(null);
      }
      setPoligonoWkt(initial.poligonoWkt ?? null);
    } else {
      setForm(EMPTY_FORM);
      setCircleState(null);
      setPoligonoWkt(null);
    }
    setShowOutros(false);
    setError(null);
  }, [open, initial]);

  // -------- DrawingManager
  useEffect(() => {
    if (!open || !isLoaded || !map) return;
    const dm = new google.maps.drawing.DrawingManager({
      map,
      drawingControl: false,
      drawingMode: null,
      circleOptions: {
        fillColor: NEW_COLOR,
        fillOpacity: 0.75,
        strokeColor: NEW_COLOR,
        strokeWeight: 2,
        clickable: false,
        editable: false,
        zIndex: 40,
      },
      polygonOptions: {
        fillColor: NEW_COLOR,
        fillOpacity: 0.75,
        strokeColor: NEW_COLOR,
        strokeWeight: 2,
        editable: true,
        zIndex: 35,
      },
    });
    drawingManagerRef.current = dm;

    const circleListener = google.maps.event.addListener(
      dm,
      'circlecomplete',
      (drawn: google.maps.Circle) => {
        const center = drawn.getCenter();
        if (!center) {
          drawn.setMap(null);
          return;
        }
        drawn.setMap(null);
        setCircleState({ lat: center.lat(), lng: center.lng() });
        dm.setDrawingMode(null);
      },
    );

    const polyListener = google.maps.event.addListener(
      dm,
      'polygoncomplete',
      (drawn: google.maps.Polygon) => {
        const path = drawn.getPath();
        try {
          const literal = pathFromGoogleLatLngs(path);
          setPoligonoWkt(pathToWktPolygon(literal));
        } catch (err) {
          logError('pathToWktPolygon drawing', err);
          drawn.setMap(null);
          return;
        }
        drawn.setMap(null);
        dm.setDrawingMode(null);
      },
    );

    return () => {
      google.maps.event.removeListener(circleListener);
      google.maps.event.removeListener(polyListener);
      dm.setMap(null);
      drawingManagerRef.current = null;
    };
  }, [open, isLoaded, map]);

  // -------- Marker + Circle estáveis (refletem circleState + form.raio)
  useEffect(() => {
    if (!open || !isLoaded || !map) return;
    circleRef.current?.setMap(null);
    markerRef.current?.setMap(null);
    circleRef.current = null;
    markerRef.current = null;
    if (!circleState) return;
    const radius = Number(form.raio);
    const validRadius = Number.isFinite(radius) && radius > 0 ? radius : 0;
    const color = isEdit ? EDIT_CIRCLE_COLOR : NEW_COLOR;
    const marker = new google.maps.Marker({
      map,
      position: circleState,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 60,
    });
    const circle = new google.maps.Circle({
      map,
      center: circleState,
      radius: validRadius,
      strokeColor: color,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.75,
      clickable: false,
    });
    markerRef.current = marker;
    circleRef.current = circle;
    map.panTo(circleState);
  }, [open, isLoaded, map, circleState, form.raio, isEdit]);

  // -------- Polígono estável
  useEffect(() => {
    if (!open || !isLoaded || !map) return;
    polygonListenersRef.current.forEach((l) => google.maps.event.removeListener(l));
    polygonListenersRef.current = [];
    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    if (!poligonoWkt) return;
    let path: LatLngLiteral[];
    try {
      path = parseWktPolygon(poligonoWkt);
    } catch (err) {
      logError('parseWktPolygon form', err);
      return;
    }
    const polygon = new google.maps.Polygon({
      map,
      paths: path,
      strokeColor: NEW_COLOR,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: NEW_COLOR,
      fillOpacity: 0.75,
      editable: true,
      zIndex: 35,
    });
    polygonRef.current = polygon;
    const updateWkt = () => {
      try {
        const literal = pathFromGoogleLatLngs(polygon.getPath());
        setPoligonoWkt(pathToWktPolygon(literal));
      } catch (err) {
        logError('polygon edit', err);
      }
    };
    polygonListenersRef.current = [
      google.maps.event.addListener(polygon.getPath(), 'set_at', updateWkt),
      google.maps.event.addListener(polygon.getPath(), 'insert_at', updateWkt),
      google.maps.event.addListener(polygon.getPath(), 'remove_at', updateWkt),
    ];
    if (path.length > 0) map.panTo(centroidOf(path));
    return () => {
      polygonListenersRef.current.forEach((l) => google.maps.event.removeListener(l));
      polygonListenersRef.current = [];
      polygonRef.current?.setMap(null);
      polygonRef.current = null;
    };
    // poligonoWkt é a fonte da verdade; reconstruímos toda vez que ele muda
    // (set via desenho/edição do próprio polygon → re-render do efeito).
  }, [open, isLoaded, map, poligonoWkt]);

  // -------- Camada "Todos os Locais" (verde, omitindo o registro em edição)
  useEffect(() => {
    if (!open || !isLoaded || !map) return;
    outrosInfoRef.current?.close();
    outrosPolygonsRef.current.forEach((p) => p.setMap(null));
    outrosPolygonsRef.current = [];
    if (!showOutros) return;
    const filtered = allLocais.filter(
      (l) => l.poligonoWkt && (!initial || l.idLocal !== initial.idLocal),
    );
    filtered.forEach((local) => {
      let path: LatLngLiteral[];
      try {
        path = parseWktPolygon(local.poligonoWkt as string);
      } catch (err) {
        logError('parseWktPolygon outros', err, { idLocal: local.idLocal });
        return;
      }
      const polygon = new google.maps.Polygon({
        map,
        paths: path,
        strokeColor: OTHER_COLOR,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: OTHER_COLOR,
        fillOpacity: 0.75,
        clickable: true,
        zIndex: 10,
      });
      polygon.addListener('click', () => {
        outrosInfoRef.current?.close();
        const iw = new google.maps.InfoWindow({
          content: infoHtml(local),
          position: centroidOf(path),
        });
        iw.open({ map });
        outrosInfoRef.current = iw;
      });
      outrosPolygonsRef.current.push(polygon);
    });
    return () => {
      outrosInfoRef.current?.close();
      outrosPolygonsRef.current.forEach((p) => p.setMap(null));
      outrosPolygonsRef.current = [];
    };
  }, [open, isLoaded, map, showOutros, allLocais, initial]);

  // -------- Limpeza geral ao fechar
  useEffect(() => {
    if (open) return;
    circleRef.current?.setMap(null);
    markerRef.current?.setMap(null);
    polygonRef.current?.setMap(null);
    outrosInfoRef.current?.close();
    outrosPolygonsRef.current.forEach((p) => p.setMap(null));
    circleRef.current = null;
    markerRef.current = null;
    polygonRef.current = null;
    outrosPolygonsRef.current = [];
  }, [open]);

  // -------- Handlers de desenho
  const startCircle = useCallback(() => {
    drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
  }, []);
  const startPolygon = useCallback(() => {
    drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }, []);
  const clearCircle = useCallback(() => {
    drawingManagerRef.current?.setDrawingMode(null);
    setCircleState(null);
  }, []);
  const clearPolygon = useCallback(() => {
    drawingManagerRef.current?.setDrawingMode(null);
    setPoligonoWkt(null);
  }, []);

  const radiusNum = Number(form.raio);
  const isValid = useMemo(
    () =>
      form.codigoPonto.trim().length > 0 &&
      form.endereco.trim().length > 0 &&
      form.pontoParada.trim().length > 0 &&
      Number.isFinite(radiusNum) &&
      radiusNum > 0 &&
      circleState != null,
    [form, radiusNum, circleState],
  );

  const handleSubmit = async () => {
    if (!isValid || !circleState) return;
    setSaving(true);
    setError(null);
    try {
      const local = await submit({
        codigoPonto: form.codigoPonto.trim(),
        endereco: form.endereco.trim(),
        latitude: circleState.lat,
        longitude: circleState.lng,
        raio: radiusNum,
        pontoParada: form.pontoParada.trim(),
        poligonoWkt,
      });
      onSaved(local);
    } catch (err) {
      logError('save local', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Falha ao salvar local.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const drawingCircle = drawingManagerRef.current?.getDrawingMode() === 'circle';
  const drawingPolygon = drawingManagerRef.current?.getDrawingMode() === 'polygon';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? `Editar local — ${initial?.codigoPonto ?? ''}` : 'Novo local'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px,1fr]">
        <div className="flex flex-col gap-3">
          <Input
            label="Código do Ponto *"
            name="codigoPonto"
            value={form.codigoPonto}
            onChange={(e) => setForm((p) => ({ ...p, codigoPonto: e.target.value }))}
            maxLength={50}
          />
          <Input
            label="Endereço *"
            name="endereco"
            value={form.endereco}
            onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
            maxLength={500}
          />
          <Input
            label="Raio (m) *"
            name="raio"
            type="number"
            min={1}
            value={form.raio}
            onChange={(e) => setForm((p) => ({ ...p, raio: e.target.value }))}
          />
          <Input
            label="Ponto de Parada *"
            name="pontoParada"
            value={form.pontoParada}
            onChange={(e) => setForm((p) => ({ ...p, pontoParada: e.target.value }))}
            maxLength={200}
          />

          <div className="mt-2 rounded-md border border-brand-line bg-brand-line-soft p-3 text-[11px] text-brand-ink-muted">
            <p>
              <strong>Obrigatório:</strong> desenhar o círculo (define latitude/longitude e raio).
            </p>
            <p className="mt-1">
              <strong>Recomendado:</strong> também desenhar o polígono da área do local.
            </p>
            {!poligonoWkt && (
              <p className="mt-2 text-amber-700">⚠ Recomendamos cadastrar o polígono do local.</p>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex h-[480px] flex-col gap-2 lg:h-[560px]">
          <div className="flex flex-wrap items-center gap-2">
            {circleState ? (
              <button
                type="button"
                onClick={clearCircle}
                className={`${DRAW_BUTTON_BASE} border border-red-300 bg-red-50 text-red-700 hover:border-red-500 hover:bg-red-100`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Apagar círculo / marker
              </button>
            ) : (
              <button
                type="button"
                onClick={startCircle}
                disabled={!isLoaded || drawingCircle}
                className={`${DRAW_BUTTON_BASE} border border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line`}
              >
                <PinIcon className="h-3.5 w-3.5" />
                Desenhar círculo
              </button>
            )}
            {poligonoWkt ? (
              <button
                type="button"
                onClick={clearPolygon}
                className={`${DRAW_BUTTON_BASE} border border-red-300 bg-red-50 text-red-700 hover:border-red-500 hover:bg-red-100`}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Apagar polígono
              </button>
            ) : (
              <button
                type="button"
                onClick={startPolygon}
                disabled={!isLoaded || drawingPolygon}
                className={`${DRAW_BUTTON_BASE} border border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line`}
              >
                <PolygonOutlineIcon className="h-3.5 w-3.5" />
                Desenhar polígono
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowOutros((v) => !v)}
              className={`${DRAW_BUTTON_BASE} ${
                showOutros
                  ? 'border border-green-600 bg-green-50 text-green-800 hover:bg-green-100'
                  : 'border border-brand-line bg-white text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line'
              }`}
              aria-pressed={showOutros}
            >
              <LayersIcon className="h-3.5 w-3.5" />
              {showOutros ? 'Ocultar todos os locais' : 'Todos os locais'}
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden rounded-card border border-brand-line bg-white">
            {!apiKey ? (
              <div className="grid h-full place-items-center bg-red-50 text-xs text-red-700">
                VITE_GOOGLE_MAPS_API_KEY não configurada
              </div>
            ) : !isLoaded ? (
              <div className="grid h-full place-items-center bg-brand-line-soft text-xs text-brand-ink-muted">
                Carregando mapa…
              </div>
            ) : (
              <>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={
                    circleState ??
                    (poligonoWkt ? centroidOf(parseWktPolygon(poligonoWkt)) : SAO_PAULO_CENTER)
                  }
                  zoom={circleState || poligonoWkt ? 15 : 12}
                  options={{
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                    mapTypeControl: true,
                  }}
                  onLoad={(m) => setMap(m)}
                  onUnmount={() => setMap(null)}
                />
                <div className="pointer-events-none absolute bottom-3 left-3 z-10">
                  <MapPoiToggle map={map} show={showPois} onToggle={() => setShowPois((v) => !v)} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
