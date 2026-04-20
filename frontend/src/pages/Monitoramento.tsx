import { useMemo, useState } from 'react';
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

const POLL_INTERVAL_MS = 15_000;

export function MonitoramentoPage() {
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);

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

  const refreshAll = () => {
    veiculosPoll.refetch();
    if (showRotas) rotasPoll.refetch();
    if (showLocais) locaisPoll.refetch();
  };

  return (
    <AppLayout title="Monitoramento" subtitle="Operação ao vivo">
      <div className="flex h-full flex-col gap-4">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1.7fr]">
          <ClockCard />
          <LastUpdateBadge
            lastUpdate={veiculosPoll.lastUpdate}
            intervalMs={POLL_INTERVAL_MS}
            loading={veiculosPoll.loading}
            error={veiculosPoll.error}
            onRefresh={refreshAll}
          />
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <ToggleChip
            active
            onClick={() => {}}
            label="Veículos ativos"
            count={veiculos.length}
            disabled
          />
          <ToggleChip
            active={showRotas}
            onClick={() => setShowRotas((v) => !v)}
            label="Rotas do dia"
            count={showRotas ? rotas.length : undefined}
          />
          <ToggleChip
            active={showLocais}
            onClick={() => setShowLocais((v) => !v)}
            label="Locais do dia"
            count={showLocais ? locais.length : undefined}
          />
        </section>

        <section className="h-[65vh] min-h-[480px]">
          <MapaMonitoramento
            veiculos={veiculos}
            rotas={rotas}
            locais={locais}
            showRotas={showRotas}
            showLocais={showLocais}
          />
        </section>

        {showRotas && (
          <section>
            <RotasTable rotas={rotas} loading={rotasPoll.loading} error={rotasPoll.error} />
          </section>
        )}
      </div>
    </AppLayout>
  );
}
