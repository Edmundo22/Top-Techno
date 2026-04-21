import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ClockCard } from '../components/monitoramento/ClockCard';
import { LastUpdateBadge } from '../components/monitoramento/LastUpdateBadge';
import { MapaMonitoramento } from '../components/monitoramento/MapaMonitoramento';
import { RotasTable } from '../components/monitoramento/RotasTable';
import { ToggleChip } from '../components/monitoramento/ToggleChip';
import { useLivePoll } from '../hooks/useLivePoll';
import {
  type LocaisResponse,
  type RotasResponse,
  type VeiculosResponse,
  monitoramentoEndpoints,
} from '../services/monitoramentoApi';
import { logData, logSuccess } from '../utils/logger';

const POLL_INTERVAL_MS = 15_000;

export function MonitoramentoPage() {
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  const [selectedViagemId, setSelectedViagemId] = useState<number | null>(null);

  const veiculosPoll = useLivePoll<VeiculosResponse>(monitoramentoEndpoints.veiculos, {
    intervalMs: POLL_INTERVAL_MS,
  });
  const rotasPoll = useLivePoll<RotasResponse>(monitoramentoEndpoints.rotas, {
    intervalMs: POLL_INTERVAL_MS,
    enabled: showRotas,
  });
  const locaisPoll = useLivePoll<LocaisResponse>(monitoramentoEndpoints.locais, {
    intervalMs: POLL_INTERVAL_MS,
    enabled: showLocais,
  });

  const veiculos = useMemo(() => veiculosPoll.data?.veiculos ?? [], [veiculosPoll.data]);
  const rotas = useMemo(() => rotasPoll.data?.rotas ?? [], [rotasPoll.data]);
  const locais = useMemo(() => locaisPoll.data?.locais ?? [], [locaisPoll.data]);

  useEffect(() => {
    logData('monitoramento veiculos', veiculos);
  }, [veiculos]);

  const handleToggleRotas = () => {
    setShowRotas((v) => {
      const next = !v;
      logSuccess('toggle rotas', { on: next });
      if (!next) setSelectedViagemId(null);
      return next;
    });
  };

  const handleToggleLocais = () => {
    setShowLocais((v) => {
      const next = !v;
      logSuccess('toggle locais', { on: next });
      return next;
    });
  };

  const handleSelectViagem = (idViagem: number | null) => {
    setSelectedViagemId((current) => (current === idViagem ? null : idViagem));
  };

  const refreshAll = () => {
    veiculosPoll.refetch();
    if (showRotas) rotasPoll.refetch();
    if (showLocais) locaisPoll.refetch();
  };

  return (
    <AppLayout title="Monitoramento" subtitle="Operação ao vivo">
      <div className="flex h-full flex-col gap-3">
        <section className="flex flex-wrap items-center gap-2">
          <ClockCard />
          <LastUpdateBadge
            lastUpdate={veiculosPoll.lastUpdate}
            intervalMs={POLL_INTERVAL_MS}
            loading={veiculosPoll.loading}
            error={veiculosPoll.error}
            onRefresh={refreshAll}
          />
          <span className="mx-1 h-4 w-px bg-brand-line" aria-hidden />
          <ToggleChip
            active
            onClick={() => {}}
            label="Veículos ativos"
            count={veiculos.length}
            disabled
          />
          <ToggleChip
            active={showRotas}
            onClick={handleToggleRotas}
            label="Rotas do dia"
            count={showRotas ? rotas.length : undefined}
          />
          <ToggleChip
            active={showLocais}
            onClick={handleToggleLocais}
            label="Locais do dia"
            count={showLocais ? locais.length : undefined}
          />
        </section>

        <section className="h-[calc(100vh-220px)] min-h-[480px]">
          <MapaMonitoramento
            veiculos={veiculos}
            rotas={rotas}
            locais={locais}
            showRotas={showRotas}
            showLocais={showLocais}
            selectedViagemId={selectedViagemId}
            onSelectViagem={handleSelectViagem}
          />
        </section>

        {showRotas && (
          <section>
            <RotasTable
              rotas={rotas}
              loading={rotasPoll.loading}
              error={rotasPoll.error}
              selectedViagemId={selectedViagemId}
              onSelectViagem={handleSelectViagem}
            />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
