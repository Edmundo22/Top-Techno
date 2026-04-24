import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { PlacasList } from '../components/historico/PlacasList';
import { ClockCard } from '../components/monitoramento/ClockCard';
import { LastUpdateBadge } from '../components/monitoramento/LastUpdateBadge';
import { MapaMonitoramento } from '../components/monitoramento/MapaMonitoramento';
import { RotasTable } from '../components/monitoramento/RotasTable';
import { ToggleChip } from '../components/monitoramento/ToggleChip';
import { ViagemEntradasTable } from '../components/monitoramento/ViagemEntradasTable';
import { useLivePoll } from '../hooks/useLivePoll';
import {
  type LocaisResponse,
  type RotasResponse,
  type Veiculo,
  type VeiculosResponse,
  monitoramentoEndpoints,
} from '../services/monitoramentoApi';
import { logData, logSuccess } from '../utils/logger';

const countLocaisUnicos = (locais: { idLocal: number }[]) =>
  new Set(locais.map((l) => l.idLocal)).size;

const POLL_INTERVAL_MS = 15_000;

const hasViagem = (v: Veiculo) => (v.idViagem ?? 0) > 0;

export function MonitoramentoPage() {
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [selectedViagemId, setSelectedViagemId] = useState<number | null>(null);
  const [selectedPlacas, setSelectedPlacas] = useState<string[]>([]);

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

  const veiculosDisponiveis = useMemo(() => veiculos.filter(hasViagem), [veiculos]);

  const placasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const v of veiculosDisponiveis) {
      if (v.placa) set.add(v.placa);
    }
    return Array.from(set).sort();
  }, [veiculosDisponiveis]);

  const veiculosVisiveis = useMemo(() => {
    if (selectedPlacas.length > 0) {
      const sel = new Set(selectedPlacas);
      return veiculos.filter((v) => v.placa != null && sel.has(v.placa));
    }
    return soDisponiveis ? veiculosDisponiveis : veiculos;
  }, [veiculos, veiculosDisponiveis, soDisponiveis, selectedPlacas]);

  const selectedVeiculos = useMemo(() => {
    const sel = new Set(selectedPlacas);
    return veiculos.filter(
      (v) => v.placa != null && sel.has(v.placa) && hasViagem(v),
    );
  }, [veiculos, selectedPlacas]);

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

  const handleToggleDisponiveis = () => {
    setSoDisponiveis((v) => {
      const next = !v;
      logSuccess('toggle disponiveis', { on: next });
      return next;
    });
  };

  const handleTogglePlaca = useCallback((placa: string) => {
    setSelectedPlacas((prev) =>
      prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
    );
  }, []);

  const handleSelectViagem = useCallback((idViagem: number | null) => {
    setSelectedViagemId((current) => (current === idViagem ? null : idViagem));
  }, []);

  const refreshAll = () => {
    veiculosPoll.refetch();
    if (showRotas) rotasPoll.refetch();
    if (showLocais) locaisPoll.refetch();
  };

  const showBottomSection = showRotas || selectedVeiculos.length > 0;

  return (
    <AppLayout title="Monitoramento" subtitle="Operação ao vivo">
      <div className="flex h-full flex-col gap-3">
        <section className="flex flex-wrap items-center justify-center gap-2">
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
            active={soDisponiveis}
            onClick={handleToggleDisponiveis}
            label="Disponíveis no dia"
            count={placasDisponiveis.length}
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
            count={showLocais ? countLocaisUnicos(locais) : undefined}
          />
        </section>

        <section className="flex min-h-[480px] flex-1 gap-3">
          {placasDisponiveis.length > 0 && (
            <PlacasList
              placas={placasDisponiveis}
              selectedPlacas={selectedPlacas}
              onTogglePlaca={handleTogglePlaca}
            />
          )}
          <div className="min-w-0 flex-1">
            <MapaMonitoramento
              veiculos={veiculosVisiveis}
              rotas={rotas}
              locais={locais}
              showRotas={showRotas}
              showLocais={showLocais}
              selectedViagemId={selectedViagemId}
              onSelectViagem={handleSelectViagem}
            />
          </div>
        </section>

        {showBottomSection && (
          <section className="flex flex-wrap gap-3">
            {showRotas && (
              <div className="min-w-[360px] flex-1">
                <RotasTable
                  rotas={rotas}
                  loading={rotasPoll.loading}
                  error={rotasPoll.error}
                  selectedViagemId={selectedViagemId}
                  onSelectViagem={handleSelectViagem}
                />
              </div>
            )}
            {selectedVeiculos.map((v) => (
              <div key={v.idVeiculo} className="min-w-[360px] flex-1">
                <ViagemEntradasTable idViagem={v.idViagem!} placa={v.placa!} />
              </div>
            ))}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
