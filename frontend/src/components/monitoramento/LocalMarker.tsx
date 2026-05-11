import { useMemo, useState } from 'react';
import { Circle, InfoWindow, Marker } from '@react-google-maps/api';
import type { LocalDia } from '../../services/monitoramentoApi';
import { formatBRDateTimeFull } from '../../utils/datetime';

interface LocalMarkerProps {
  data: LocalDia;
}

const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z';

const COLOR_LOCAL_SEM_DADO = '#000000';
const COLOR_LOCAL_NO_PRAZO = '#1d4ed8';
const COLOR_LOCAL_NO_HORARIO_ATIVO = '#7c3aed';
const COLOR_LOCAL_ATRASADO = '#dc2626';

const COLOR_DOT_PREVISTO = '#eab308';
const COLOR_DOT_REALIZADO = '#16a34a';

function pickLocalColor(data: LocalDia): string {
  const { dtEntPrevista, dtSaiPrevista, dtEntReal, dtSaiReal } = data;
  if (dtEntReal == null && dtSaiReal == null) return COLOR_LOCAL_SEM_DADO;
  const entAtrasada =
    dtEntReal != null && dtEntPrevista != null && dtEntReal > dtEntPrevista;
  const saiAtrasada =
    dtSaiReal != null && dtSaiPrevista != null && dtSaiReal > dtSaiPrevista;
  if (entAtrasada || saiAtrasada) return COLOR_LOCAL_ATRASADO;
  if (dtEntReal != null && dtSaiReal == null) return COLOR_LOCAL_NO_HORARIO_ATIVO;
  return COLOR_LOCAL_NO_PRAZO;
}

export function LocalMarker({ data }: LocalMarkerProps) {
  const [openInfo, setOpenInfo] = useState(false);
  const [showRaio, setShowRaio] = useState(false);

  const position = useMemo(() => {
    if (data.latitude == null || data.longitude == null) return null;
    return { lat: data.latitude, lng: data.longitude };
  }, [data.latitude, data.longitude]);

  if (!position) return null;

  const color = pickLocalColor(data);

  const icon: google.maps.Symbol = {
    path: PIN_PATH,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.6,
    anchor: new google.maps.Point(12, 22),
  };

  return (
    <>
      <Marker
        position={position}
        icon={icon}
        onClick={() => setOpenInfo((v) => !v)}
        zIndex={10}
      />

      {showRaio && data.raio != null && data.raio > 0 && (
        <Circle
          center={position}
          radius={data.raio}
          options={{
            fillColor: color,
            fillOpacity: 0.75,
            strokeColor: color,
            strokeOpacity: 0.85,
            strokeWeight: 1.5,
            clickable: false,
          }}
        />
      )}

      {openInfo && (
        <InfoWindow
          position={position}
          onCloseClick={() => setOpenInfo(false)}
          options={{ pixelOffset: new google.maps.Size(0, -32) }}
        >
          <div className="min-w-[240px] max-w-[300px] space-y-1 text-xs text-brand-ink">
            <div className="text-sm font-semibold">{data.endereco ?? 'Sem endereço'}</div>
            <div>
              <span className="text-brand-ink-muted">Ponto de parada: </span>
              {data.pontoParada ?? '—'}
            </div>
            <div className="pt-1 text-[11px] uppercase tracking-wider text-brand-ink-muted">
              Previsto
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: COLOR_DOT_PREVISTO }}
                aria-hidden
              />
              <span className="text-brand-ink-muted">Entrada: </span>
              {formatBRDateTimeFull(data.dtEntPrevista)}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: COLOR_DOT_PREVISTO }}
                aria-hidden
              />
              <span className="text-brand-ink-muted">Saída: </span>
              {formatBRDateTimeFull(data.dtSaiPrevista)}
            </div>
            <div className="pt-1 text-[11px] uppercase tracking-wider text-brand-ink-muted">
              Realizado
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: COLOR_DOT_REALIZADO }}
                aria-hidden
              />
              <span className="text-brand-ink-muted">Entrada: </span>
              {formatBRDateTimeFull(data.dtEntReal)}
            </div>
            <div>
              <span
                className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: COLOR_DOT_REALIZADO }}
                aria-hidden
              />
              <span className="text-brand-ink-muted">Saída: </span>
              {formatBRDateTimeFull(data.dtSaiReal)}
            </div>

            <button
              type="button"
              onClick={() => setShowRaio((v) => !v)}
              className={`mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                showRaio
                  ? 'bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                  : 'border border-brand-line bg-white text-brand-ink hover:bg-brand-line-soft'
              }`}
              disabled={data.raio == null || data.raio <= 0}
            >
              {data.raio == null || data.raio <= 0
                ? 'Raio indisponível'
                : showRaio
                ? `Ocultar raio (${data.raio} m)`
                : `Mostrar raio (${data.raio} m)`}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
