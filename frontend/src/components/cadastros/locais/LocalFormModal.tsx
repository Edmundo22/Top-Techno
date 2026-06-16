import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  TerraDraw,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { MapPoiToggle } from '../../ui/MapPoiToggle';
import { Modal } from '../../ui/Modal';
import { LayersIcon, PinIcon, PolygonOutlineIcon, TrashIcon } from '../../ui/icons';
import { MAP_LIBRARIES } from '../../../services/googleMaps';
import type { LocalDTO, LocalUpsertBody } from '../../../services/locaisApi';
import {
  centroidOf,
  parseWktPolygon,
  pathToWktPolygon,
  type LatLngLiteral,
} from '../../../utils/wkt';
import { logError } from '../../../utils/logger';

const NEW_COLOR = '#dc2626' as const; // vermelho — círculo/polígono novos
const EDIT_CIRCLE_COLOR = '#f97316' as const; // laranja — ponto/círculo quando em edição
const OTHER_COLOR = '#16a34a' as const; // verde — camada "Todos os Locais"
const CLOSED_COLOR = '#16a34a' as const; // verde — polígono já fechado (pronto p/ editar)
const DRAW_BUTTON_BASE =
  'inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const SAO_PAULO_CENTER = { lat: -23.55052, lng: -46.633308 };

const containerStyle = { width: '100%', height: '100%' };

// Modos do Terra Draw usados na tela (nomes default das classes).
type DrawMode = 'point' | 'polygon' | 'select';

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

// GeoJSON do Terra Draw usa [lng, lat]; o polígono carrega properties.mode.
function polygonFeature(ring: LatLngLiteral[]): GeoJSONStoreFeatures {
  const coords = ring.map((p) => [p.lng, p.lat]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    coords.push(first); // GeoJSON exige anel fechado
  }
  return {
    type: 'Feature',
    properties: { mode: 'polygon' },
    geometry: { type: 'Polygon', coordinates: [coords] },
  } as GeoJSONStoreFeatures;
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
  const [circleState, setCircleState] = useState<{ lat: number; lng: number } | null>(null);
  const [poligonoWkt, setPoligonoWkt] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('select');
  const [drawReady, setDrawReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(SAO_PAULO_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [showOutros, setShowOutros] = useState(false);
  const [showPois, setShowPois] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
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
      const hasPoint = initial.latitude != null && initial.longitude != null;
      setCircleState(hasPoint ? { lat: initial.latitude as number, lng: initial.longitude as number } : null);
      setPoligonoWkt(initial.poligonoWkt ?? null);
      if (hasPoint) {
        setMapCenter({ lat: initial.latitude as number, lng: initial.longitude as number });
        setMapZoom(15);
      } else if (initial.poligonoWkt) {
        try {
          setMapCenter(centroidOf(parseWktPolygon(initial.poligonoWkt)));
          setMapZoom(15);
        } catch {
          setMapCenter(SAO_PAULO_CENTER);
          setMapZoom(12);
        }
      } else {
        setMapCenter(SAO_PAULO_CENTER);
        setMapZoom(12);
      }
    } else {
      setForm(EMPTY_FORM);
      setCircleState(null);
      setPoligonoWkt(null);
      setMapCenter(SAO_PAULO_CENTER);
      setMapZoom(12);
    }
    setDrawMode('select');
    setShowOutros(false);
    setError(null);
  }, [open, initial]);

  // -------- Lê o polígono do store do Terra Draw e reflete no WKT.
  // O centro (circleState) NÃO é tocado aqui — ele é overlay imperativo e só
  // muda ao posicionar ou apagar, nunca por clique no mapa.
  const syncFromStore = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;
    const polygons = draw.getSnapshot().filter((f) => f.geometry.type === 'Polygon');

    // garante no máximo 1 polígono — mantém o último
    const extras = polygons
      .slice(0, -1)
      .map((f) => f.id)
      .filter((id): id is string | number => id != null);
    if (extras.length) draw.removeFeatures(extras);

    const polygon = polygons[polygons.length - 1];
    if (polygon && polygon.geometry.type === 'Polygon') {
      const ring = (polygon.geometry.coordinates[0] as [number, number][]).map(([lng, lat]) => ({
        lat,
        lng,
      }));
      try {
        setPoligonoWkt(pathToWktPolygon(ring));
      } catch (err) {
        logError('terra-draw polygon -> wkt', err);
      }
    } else {
      setPoligonoWkt(null);
    }
  }, []);

  // -------- Inicializa o Terra Draw quando o mapa está pronto
  useEffect(() => {
    if (!open || !isLoaded || !map) return;
    let projectionListener: google.maps.MapsEventListener | null = null;
    let rightClickListener: google.maps.MapsEventListener | null = null;
    let disposed = false;
    const pointColor = isEdit ? EDIT_CIRCLE_COLOR : NEW_COLOR;

    const init = () => {
      if (disposed) return;
      const draw = new TerraDraw({
        adapter: new TerraDrawGoogleMapsAdapter({
          lib: google.maps,
          map,
          coordinatePrecision: 9,
        }),
        modes: [
          new TerraDrawPointMode({
            styles: {
              pointColor,
              pointWidth: 6,
              pointOutlineColor: '#ffffff',
              pointOutlineWidth: 2,
            },
          }),
          new TerraDrawPolygonMode({
            styles: {
              // vermelho enquanto desenha; verde depois de fechado (editável)
              fillColor: (feature: GeoJSONStoreFeatures) =>
                feature.properties.currentlyDrawing ? NEW_COLOR : CLOSED_COLOR,
              fillOpacity: 0.4,
              outlineColor: (feature: GeoJSONStoreFeatures) =>
                feature.properties.currentlyDrawing ? NEW_COLOR : CLOSED_COLOR,
              outlineWidth: 2,
            },
          }),
          new TerraDrawSelectMode({
            flags: {
              point: { feature: { draggable: true } },
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: {
                    midpoints: { draggable: true },
                    draggable: true,
                    deletable: true,
                  },
                },
              },
            },
          }),
        ],
      });
      drawRef.current = draw;

      draw.on('ready', () => {
        if (disposed) return;
        // O centro NÃO entra no Terra Draw (vira overlay imperativo); só o polígono.
        if (initial?.poligonoWkt) {
          try {
            draw.addFeatures([polygonFeature(parseWktPolygon(initial.poligonoWkt))]);
          } catch (err) {
            logError('terra-draw load polygon', err);
          }
        }
        draw.setMode('select');
        setDrawMode('select');
        setDrawReady(true);
      });

      draw.on('finish', (id, context) => {
        // Ponto (centro): captura a coordenada e REMOVE do Terra Draw. O centro
        // passa a ser overlay imperativo (marker + círculo do raio), que clique
        // nenhum do mapa pode mover/apagar — só o botão "Apagar círculo" limpa.
        if (context.mode === 'point') {
          const feat = draw.getSnapshotFeature(id);
          if (feat && feat.geometry.type === 'Point') {
            const [lng, lat] = feat.geometry.coordinates as [number, number];
            setCircleState({ lat, lng });
          }
          const pointIds = draw
            .getSnapshot()
            .filter((f) => f.geometry.type === 'Point')
            .map((f) => f.id)
            .filter((pid): pid is string | number => pid != null);
          if (pointIds.length) draw.removeFeatures(pointIds);
          draw.setMode('select');
          setDrawMode('select');
          return;
        }
        // Polígono: concluído (desenho/right-click) ou arraste de vértice.
        syncFromStore();
        if (context.action === 'draw') {
          draw.setMode('select');
          setDrawMode('select');
          if (context.mode === 'polygon') {
            // já entra selecionado, com os vértices prontos para edição
            try {
              draw.selectFeature(id);
            } catch (err) {
              logError('terra-draw selectFeature', err);
            }
          }
        }
      });
      // exclusões (de feature ou de vértice) não disparam 'finish'
      draw.on('change', (_ids, type) => {
        if (type === 'delete') syncFromStore();
      });

      // Right-click fecha o polígono em desenho (a partir do 3º vértice). O
      // Terra Draw fecha pela tecla de "finish" (Enter) e o adapter escuta keyup
      // no getDiv(); então disparamos um Enter ali. O close() do mode valida o
      // número de vértices internamente (não fecha com menos de 3).
      rightClickListener = google.maps.event.addListener(map, 'rightclick', () => {
        if (drawRef.current?.getMode() !== 'polygon') return;
        map.getDiv().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      });

      draw.start();
    };

    if (map.getProjection()) {
      init();
    } else {
      projectionListener = google.maps.event.addListenerOnce(map, 'projection_changed', init);
    }

    return () => {
      disposed = true;
      projectionListener?.remove();
      rightClickListener?.remove();
      try {
        drawRef.current?.stop();
      } catch (err) {
        logError('terra-draw stop', err);
      }
      drawRef.current = null;
      setDrawReady(false);
    };
  }, [open, isLoaded, map, isEdit, initial, syncFromStore]);

  // -------- Centro + círculo do raio (overlay imperativo): refletem circleState
  // + form.raio. clickable:false — nada no mapa interage com eles.
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
    markerRef.current = new google.maps.Marker({
      map,
      position: circleState,
      clickable: false,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: 6,
    });
    circleRef.current = new google.maps.Circle({
      map,
      center: circleState,
      radius: validRadius,
      strokeColor: color,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.25,
      clickable: false,
      zIndex: 5,
    });
  }, [open, isLoaded, map, circleState, form.raio, isEdit]);

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
        fillOpacity: 0.25,
        clickable: true,
        zIndex: 1,
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
    circleRef.current = null;
    markerRef.current = null;
    outrosInfoRef.current?.close();
    outrosPolygonsRef.current.forEach((p) => p.setMap(null));
    outrosPolygonsRef.current = [];
  }, [open]);

  // -------- Handlers de desenho (delegam ao Terra Draw)
  const applyMode = useCallback((mode: DrawMode) => {
    drawRef.current?.setMode(mode);
    setDrawMode(mode);
  }, []);
  const startPoint = useCallback(() => applyMode('point'), [applyMode]);
  const startPolygon = useCallback(() => applyMode('polygon'), [applyMode]);
  const cancelDraw = useCallback(() => applyMode('select'), [applyMode]);
  const clearCircle = useCallback(() => {
    const draw = drawRef.current;
    if (draw) {
      const ids = draw
        .getSnapshot()
        .filter((f) => f.geometry.type === 'Point')
        .map((f) => f.id)
        .filter((id): id is string | number => id != null);
      if (ids.length) draw.removeFeatures(ids);
      draw.setMode('select');
    }
    setDrawMode('select');
    setCircleState(null);
  }, []);
  const clearPolygon = useCallback(() => {
    const draw = drawRef.current;
    if (draw) {
      const ids = draw
        .getSnapshot()
        .filter((f) => f.geometry.type === 'Polygon')
        .map((f) => f.id)
        .filter((id): id is string | number => id != null);
      if (ids.length) draw.removeFeatures(ids);
      draw.setMode('select');
    }
    setDrawMode('select');
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

  const drawingPoint = drawMode === 'point';
  const drawingPolygon = drawMode === 'polygon';

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
              <strong>Obrigatório:</strong> clique em “Desenhar círculo” e toque no mapa para
              posicionar o ponto (latitude/longitude). O raio vem do campo acima.
            </p>
            <p className="mt-1">
              <strong>Recomendado:</strong> clique em “Desenhar polígono” e toque no mapa para
              adicionar os vértices. A partir do 3º vértice, <strong>clique com o botão direito</strong>{' '}
              (ou no primeiro ponto) para fechar — ele fica <span className="text-green-700">verde</span>.
            </p>
            <p className="mt-1">
              Depois de fechado, clique no polígono e arraste os vértices para ajustar o formato.
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

        <div className="flex h-[55vh] min-h-[360px] flex-col gap-2 lg:h-[62vh]">
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
            ) : drawingPoint ? (
              <button
                type="button"
                onClick={cancelDraw}
                className={`${DRAW_BUTTON_BASE} border border-brand-accent bg-brand-accent-soft text-brand-ink`}
              >
                <PinIcon className="h-3.5 w-3.5" />
                Clique no mapa… (cancelar)
              </button>
            ) : (
              <button
                type="button"
                onClick={startPoint}
                disabled={!drawReady}
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
            ) : drawingPolygon ? (
              <button
                type="button"
                onClick={cancelDraw}
                className={`${DRAW_BUTTON_BASE} border border-brand-accent bg-brand-accent-soft text-brand-ink`}
              >
                <PolygonOutlineIcon className="h-3.5 w-3.5" />
                Fechando no 1º ponto / duplo-clique (cancelar)
              </button>
            ) : (
              <button
                type="button"
                onClick={startPolygon}
                disabled={!drawReady}
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
                  center={mapCenter}
                  zoom={mapZoom}
                  options={{
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                    mapTypeControl: true,
                    disableDoubleClickZoom: true,
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
