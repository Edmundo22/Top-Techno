import { Card } from '../../ui/Card';
import { UnlinkIcon } from '../../ui/icons';
import type { VinculadoDTO } from '../../../services/motoristaRotaApi';

interface VinculadosTableProps {
  vinculados: VinculadoDTO[];
  loading: boolean;
  busyId: number | null; // idCadMotRota em operação — desabilita interações
  onToggleTitular: (vinculado: VinculadoDTO) => void;
  onDesvincular: (vinculado: VinculadoDTO) => void;
}

export function VinculadosTable({
  vinculados,
  loading,
  busyId,
  onToggleTitular,
  onDesvincular,
}: VinculadosTableProps) {
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-line px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-ink">Motoristas vinculados</h3>
        <span className="text-[11px] text-brand-ink-muted">{vinculados.length} vínculo(s)</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-[11px] sm:text-xs">
          <thead className="sticky top-0 z-10 bg-brand-line-soft shadow-[0_1px_0_0_var(--color-line)]">
            <tr>
              <th className="px-2 sm:px-3 py-2 font-semibold text-brand-ink">Motorista</th>
              <th className="px-2 sm:px-3 py-2 font-semibold text-brand-ink">CNH</th>
              <th className="px-2 sm:px-3 py-2 text-center font-semibold text-brand-ink">Titular</th>
              <th className="px-2 sm:px-3 py-2 text-center font-semibold text-brand-ink">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-line">
            {loading && vinculados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 sm:px-3 py-6 text-center text-brand-ink-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && vinculados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 sm:px-3 py-6 text-center text-brand-ink-muted">
                  Nenhum motorista vinculado a esta rota.
                </td>
              </tr>
            )}
            {vinculados.map((v) => (
              <tr key={v.idCadMotRota} className="hover:bg-brand-line-soft">
                <td className="px-2 sm:px-3 py-1.5 text-brand-ink">{v.motorista ?? '-'}</td>
                <td className="px-2 sm:px-3 py-1.5 text-brand-ink">{v.cnh ?? '-'}</td>
                <td className="px-2 sm:px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={v.titular}
                    disabled={busyId != null}
                    onChange={() => onToggleTitular(v)}
                    className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Definir ${v.motorista ?? ''} como titular`}
                  />
                </td>
                <td className="px-2 sm:px-3 py-1 text-center">
                  <button
                    type="button"
                    title="Desvincular da rota"
                    aria-label="Desvincular da rota"
                    disabled={busyId != null}
                    onClick={() => onDesvincular(v)}
                    className="mx-auto grid h-8 w-8 place-items-center rounded-md text-brand-ink-soft transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UnlinkIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
