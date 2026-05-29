import { useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import type { Rota } from '../../services/monitoramentoApi';
import { formatBRDateTime } from '../../utils/datetime';

interface RotasTableProps {
  rotas: Rota[];
  loading: boolean;
  error: string | null;
  selectedViagemId: number | null;
  onSelectViagem: (idViagem: number | null) => void;
}

export function RotasTable({
  rotas,
  loading,
  error,
  selectedViagemId,
  onSelectViagem,
}: RotasTableProps) {
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (selectedViagemId != null && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedViagemId]);

  return (
    <Card className="flex max-h-[360px] flex-col overflow-hidden p-0">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-line px-5 py-3">
        <h2 className="text-sm font-semibold text-brand-ink">Todas as rotas de hoje</h2>
        <span className="text-xs text-brand-ink-muted">
          {loading ? 'atualizando…' : `${rotas.length} viagem(ns)`}
        </span>
      </div>

      {error ? (
        <div className="px-5 py-6 text-xs text-red-700">{error}</div>
      ) : rotas.length === 0 ? (
        <div className="px-5 py-6 text-xs text-brand-ink-muted">
          Nenhuma viagem com rota publicada para hoje.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-brand-line-soft text-[11px] uppercase tracking-wider text-brand-ink-muted shadow-[0_1px_0_0_var(--color-line)]">
              <tr>
                <th className="px-5 py-2 font-semibold">Linha</th>
                <th className="px-5 py-2 font-semibold">Status viagem</th>
                <th className="px-5 py-2 font-semibold">Placa</th>
                <th className="px-5 py-2 font-semibold">Data início</th>
                <th className="px-5 py-2 font-semibold">Data fim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {rotas.map((r) => {
                const isSelected = r.idViagem === selectedViagemId;
                return (
                  <tr
                    key={r.idViagem}
                    ref={isSelected ? selectedRowRef : undefined}
                    onClick={() => onSelectViagem(r.idViagem)}
                    className={`cursor-pointer text-brand-ink transition-colors ${
                      isSelected
                        ? 'bg-brand-accent-soft ring-2 ring-inset ring-brand-accent'
                        : 'hover:bg-brand-line-soft/50'
                    }`}
                  >
                    <td className="px-5 py-2 font-semibold tabular-nums">{r.numeroLinha ?? '—'}</td>
                    <td className="px-5 py-2">{r.statusLabel ?? '—'}</td>
                    <td className="px-5 py-2 font-semibold">{r.placa ?? '—'}</td>
                    <td className="px-5 py-2">{formatBRDateTime(r.dtIniViagem)}</td>
                    <td className="px-5 py-2">{formatBRDateTime(r.dtFimViagem)}</td>
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
