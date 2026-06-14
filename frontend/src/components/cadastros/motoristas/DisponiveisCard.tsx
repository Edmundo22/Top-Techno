import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import type { DisponivelDTO } from '../../../services/motoristaRotaApi';

interface DisponiveisCardProps {
  disponiveis: DisponivelDTO[];
  loading: boolean;
  submitting: boolean;
  onVincular: (idsCadMot: number[]) => void;
}

// Lista de checkboxes dos motoristas ainda NÃO vinculados à rota. O estado dos
// marcados é local; o pai remonta este card (key=idFt) ao trocar de rota, então
// a seleção não vaza entre rotas. Após enviar, limpamos os marcados.
export function DisponiveisCard({
  disponiveis,
  loading,
  submitting,
  onVincular,
}: DisponiveisCardProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (checked.size === 0) return;
    onVincular([...checked]);
    setChecked(new Set());
  };

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-brand-line px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-ink">Disponíveis para vincular</h3>
        <span className="text-[11px] text-brand-ink-muted">{disponiveis.length} motorista(s)</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {loading && disponiveis.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-brand-ink-muted">Carregando…</p>
        )}
        {!loading && disponiveis.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-brand-ink-muted">
            Todos os motoristas já estão vinculados a esta rota.
          </p>
        )}
        <ul className="flex flex-col">
          {disponiveis.map((d) => (
            <li key={d.idCadMot}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs text-brand-ink hover:bg-brand-line-soft">
                <input
                  type="checkbox"
                  checked={checked.has(d.idCadMot)}
                  onChange={() => toggle(d.idCadMot)}
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{d.motorista ?? '-'}</span>
                  <span className="text-[11px] text-brand-ink-muted">CNH {d.cnh ?? '-'}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-shrink-0 items-center justify-between border-t border-brand-line bg-brand-line-soft px-4 py-2">
        <span className="text-[11px] text-brand-ink-muted">{checked.size} selecionado(s)</span>
        <Button onClick={handleSubmit} disabled={checked.size === 0 || submitting} className="h-9">
          {submitting ? 'Vinculando…' : 'Vincular selecionados'}
        </Button>
      </div>
    </Card>
  );
}
