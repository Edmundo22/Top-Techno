import { Card } from '../ui/Card';
import { useLivePoll } from '../../hooks/useLivePoll';
import {
  type ViagemEntradasResponse,
  monitoramentoEndpoints,
} from '../../services/monitoramentoApi';

interface ViagemEntradasTableProps {
  idViagem: number;
  placa: string;
}

const POLL_INTERVAL_MS = 15_000;
const ON_TIME_BG = 'bg-sky-100';
const LATE_BG = 'bg-red-100';

function cellBg(realIso: string | null, prevIso: string | null): string {
  if (!realIso || !prevIso) return '';
  return realIso > prevIso ? LATE_BG : ON_TIME_BG;
}

function formatTLocal(min: number | null): string {
  if (min == null) return '—';
  return `${min} min`;
}

export function ViagemEntradasTable({ idViagem, placa }: ViagemEntradasTableProps) {
  const poll = useLivePoll<ViagemEntradasResponse>(
    monitoramentoEndpoints.viagemEntradas(idViagem),
    { intervalMs: POLL_INTERVAL_MS },
  );

  const entradas = poll.data?.entradas ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-brand-line px-5 py-3">
        <h2 className="text-sm font-semibold text-brand-ink">
          Entradas — <span className="font-bold">{placa}</span>
        </h2>
        <span className="text-xs text-brand-ink-muted">
          {poll.loading ? 'atualizando…' : `${entradas.length} parada(s)`}
        </span>
      </div>

      {poll.error ? (
        <div className="px-5 py-6 text-xs text-red-700">{poll.error}</div>
      ) : entradas.length === 0 && !poll.loading ? (
        <div className="px-5 py-6 text-xs text-brand-ink-muted">
          Sem paradas cadastradas para essa viagem.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-brand-line-soft text-[11px] uppercase tracking-wider text-brand-ink-muted">
              <tr>
                <th className="px-5 py-2 font-semibold">Ordem</th>
                <th className="px-5 py-2 font-semibold">Data</th>
                <th className="px-5 py-2 font-semibold">Local</th>
                <th className="px-5 py-2 font-semibold">Ent. prev.</th>
                <th className="px-5 py-2 font-semibold">Ent. real</th>
                <th className="px-5 py-2 font-semibold">Saí. prev.</th>
                <th className="px-5 py-2 font-semibold">Saí. real</th>
                <th className="px-5 py-2 font-semibold">T. local</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {entradas.map((e, idx) => {
                const entBg = cellBg(e.dtEntRealIso, e.dtEntPrevistaIso);
                const saiBg = cellBg(e.dtSaiRealIso, e.dtSaiPrevistaIso);
                return (
                  <tr
                    key={`${idViagem}-${e.ordem ?? idx}`}
                    className="text-brand-ink"
                  >
                    <td className="px-5 py-2 tabular-nums">{e.ordem ?? '—'}</td>
                    <td className="px-5 py-2 tabular-nums">{e.dt ?? '—'}</td>
                    <td className="px-5 py-2">{e.local ?? '—'}</td>
                    <td className="px-5 py-2 tabular-nums">{e.entPrev ?? '—'}</td>
                    <td className={`px-5 py-2 tabular-nums ${entBg}`}>
                      {e.entReal ?? '—'}
                    </td>
                    <td className="px-5 py-2 tabular-nums">{e.saiPrev ?? '—'}</td>
                    <td className={`px-5 py-2 tabular-nums ${saiBg}`}>
                      {e.saiReal ?? '—'}
                    </td>
                    <td className="px-5 py-2 tabular-nums">
                      {formatTLocal(e.tLocalMin)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
