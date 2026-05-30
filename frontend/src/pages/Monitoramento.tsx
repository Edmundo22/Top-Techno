import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ClockCard } from '../components/monitoramento/ClockCard';
import { FiltrosLateral } from '../components/monitoramento/FiltrosLateral';
import { LastUpdateBadge } from '../components/monitoramento/LastUpdateBadge';
import { MapaMonitoramento } from '../components/monitoramento/MapaMonitoramento';
import { RotasTable } from '../components/monitoramento/RotasTable';
import { StatInfoCard } from '../components/monitoramento/StatInfoCard';
import { StatToggleCard } from '../components/monitoramento/StatToggleCard';
import { ToggleChip } from '../components/monitoramento/ToggleChip';
import { ViagemEntradasTable } from '../components/monitoramento/ViagemEntradasTable';
import { BanCircleIcon, CheckCircleIcon, PinIcon, RouteIcon } from '../components/ui/icons';
import { useLivePoll } from '../hooks/useLivePoll';
import {
  type LocaisResponse,
  type RotasResponse,
  type Veiculo,
  type VeiculosResponse,
  monitoramentoEndpoints,
} from '../services/monitoramentoApi';
import { logSuccess } from '../utils/logger';

// Veículos: posição "ao vivo" — 15s.
const POLL_VEICULOS_MS = 15_000;
// Rotas/linhas: atualizadas no máximo 1x/dia — 2 min é suficiente para o filtro
// lateral refletir cadastros novos sem martelar o banco.
const POLL_ROTAS_MS = 2 * 60_000;
// Locais: cores e horários de entrada/saída precisam de refresh frequente, mas
// só vale a pena puxar enquanto houver pelo menos um marker visível no viewport.
const POLL_LOCAIS_MS = 30_000;

const countLocaisUnicos = (locais: { idLocal: number }[]) =>
  new Set(locais.map((l) => l.idLocal)).size;

export function MonitoramentoPage() {
  // Veículos com rota são SEMPRE visíveis no mapa. O card correspondente é só
  // informativo (mostra contagem). O usuário ainda pode escolher exibir os
  // veículos sem rota com o toggle dedicado.
  const [showSemRota, setShowSemRota] = useState(false);  // default OFF
  // Camadas extras no mapa
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  // Seleção (placa↔linha bidirecional, multi-select)
  const [selectedPlacas, setSelectedPlacas] = useState<string[]>([]);
  const [selectedLinhas, setSelectedLinhas] = useState<string[]>([]);
  // Subconjunto das placas selecionadas para as quais o usuário ligou
  // o "Mostrar posições" — vai virar uma camada de bolinhas no mapa.
  const [selectedPosicoesPlacas, setSelectedPosicoesPlacas] = useState<string[]>([]);
  // Seleção de rota individual (vinda do clique na tabela / endpoints I/F)
  const [selectedViagemId, setSelectedViagemId] = useState<number | null>(null);

  // Quantos markers de local estão dentro do viewport atual do mapa.
  // Reportado pelo MapaMonitoramento a cada `idle` do mapa.
  const [visibleLocaisCount, setVisibleLocaisCount] = useState(0);
  // Marca a primeira resposta bem-sucedida de /locais. Antes dela, deixamos o
  // polling rodar sem o gate de visibilidade (caso contrário, sem dados não há
  // markers para checar bounds → polling nunca dispara → impasse).
  const [hasInitialLocais, setHasInitialLocais] = useState(false);

  const veiculosPoll = useLivePoll<VeiculosResponse>(monitoramentoEndpoints.veiculos, {
    intervalMs: POLL_VEICULOS_MS,
  });
  // /rotas: 2 min, sempre ativo — o catálogo de linhas e o mapeamento placa↔linha
  // dependem desses dados (sem polling, o filtro lateral de linhas fica vazio).
  const rotasPoll = useLivePoll<RotasResponse>(monitoramentoEndpoints.rotas, {
    intervalMs: POLL_ROTAS_MS,
  });
  const locaisLayerActive =
    showLocais || selectedPlacas.length > 0 || selectedLinhas.length > 0;
  const locaisPoll = useLivePoll<LocaisResponse>(monitoramentoEndpoints.locais, {
    intervalMs: POLL_LOCAIS_MS,
    // Camada precisa estar visível E (ainda não fetchamos OU há marker no viewport).
    enabled: locaisLayerActive && (!hasInitialLocais || visibleLocaisCount > 0),
  });

  useEffect(() => {
    if (locaisPoll.lastUpdate != null && !hasInitialLocais) {
      setHasInitialLocais(true);
    }
  }, [locaisPoll.lastUpdate, hasInitialLocais]);

  // Reset do gate quando a camada de locais deixa de estar ativa, para que o
  // próximo "ligar" comece com fetch garantido (não depende de bounds antigos).
  useEffect(() => {
    if (!locaisLayerActive) {
      setHasInitialLocais(false);
      setVisibleLocaisCount(0);
    }
  }, [locaisLayerActive]);

  const handleVisibleLocaisChange = useCallback((count: number) => {
    setVisibleLocaisCount(count);
  }, []);

  // Quando o mapa termina de carregar, força um refetch dos veículos para
  // garantir que os markers verdes (com rota) montem com o contexto do mapa já
  // pronto. Sem isso, a primeira leva de veículos pode chegar antes do
  // <GoogleMap> dar onLoad e ficar invisível até o próximo poll de 15s.
  const handleMapReady = useCallback(() => {
    veiculosPoll.refetch();
  }, [veiculosPoll.refetch]);

  const veiculos = useMemo(() => veiculosPoll.data?.veiculos ?? [], [veiculosPoll.data]);
  const rotas = useMemo(() => rotasPoll.data?.rotas ?? [], [rotasPoll.data]);
  const locais = useMemo(() => locaisPoll.data?.locais ?? [], [locaisPoll.data]);

  // -------- partições por "com rota"
  // Resiliência: o sinal preferido é o `temRota` do backend (booleano), que
  // confirma que a viagem do dia tem POLYLINE em FT_CABECALHO. Se vier ausente
  // (backend antigo) ou se o backend explicitamente disser `false` mas o veículo
  // tiver `idViagem` válido (viagem cadastrada mesmo sem polyline), tratamos
  // como "com rota" — evita tela em branco quando os dados não estão 100%.
  const hasRota = useCallback((v: Veiculo) => {
    if (v.temRota === true) return true;
    if (v.temRota === false) return false;
    return (v.idViagem ?? 0) > 0;
  }, []);
  const veiculosComRota = useMemo(() => veiculos.filter(hasRota), [veiculos, hasRota]);
  const veiculosSemRota = useMemo(
    () => veiculos.filter((v) => !hasRota(v)),
    [veiculos, hasRota],
  );

  // -------- catálogo de placas e linhas para o filtro lateral
  const placasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const v of veiculosComRota) {
      if (v.placa) set.add(v.placa);
    }
    return Array.from(set).sort();
  }, [veiculosComRota]);

  const linhasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const r of rotas) {
      if (r.numeroLinha) set.add(r.numeroLinha);
    }
    return Array.from(set).sort();
  }, [rotas]);

  // -------- mapeamentos para vínculo placa ↔ linha (multi:1 em ambas as direções)
  const placaToLinhas = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of rotas) {
      if (!r.placa || !r.numeroLinha) continue;
      if (!map.has(r.placa)) map.set(r.placa, new Set());
      map.get(r.placa)!.add(r.numeroLinha);
    }
    return map;
  }, [rotas]);

  const linhaToPlacas = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of rotas) {
      if (!r.placa || !r.numeroLinha) continue;
      if (!map.has(r.numeroLinha)) map.set(r.numeroLinha, new Set());
      map.get(r.numeroLinha)!.add(r.placa);
    }
    return map;
  }, [rotas]);

  // Conjunto unificado de placas após combinar seleção direta + seleção via linha
  const placasFiltradas = useMemo(() => {
    const set = new Set<string>(selectedPlacas);
    for (const linha of selectedLinhas) {
      const placas = linhaToPlacas.get(linha);
      if (placas) placas.forEach((p) => set.add(p));
    }
    return set;
  }, [selectedPlacas, selectedLinhas, linhaToPlacas]);

  // -------- toggles placa↔linha (mantém em sincronia)
  const handleTogglePlaca = useCallback(
    (placa: string) => {
      setSelectedPlacas((prev) =>
        prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
      );
      const linhas = placaToLinhas.get(placa);
      if (!linhas) return;
      setSelectedLinhas((prev) => {
        const isAdding = !selectedPlacas.includes(placa);
        if (isAdding) {
          const next = new Set(prev);
          linhas.forEach((l) => next.add(l));
          return Array.from(next);
        }
        // Removendo: tira as linhas dessa placa que não pertencem a nenhuma outra placa selecionada
        const remainingPlacas = selectedPlacas.filter((p) => p !== placa);
        const stillCovered = new Set<string>();
        for (const p of remainingPlacas) {
          placaToLinhas.get(p)?.forEach((l) => stillCovered.add(l));
        }
        return prev.filter((l) => !linhas.has(l) || stillCovered.has(l));
      });
    },
    [placaToLinhas, selectedPlacas],
  );

  const handleToggleLinha = useCallback(
    (linha: string) => {
      setSelectedLinhas((prev) =>
        prev.includes(linha) ? prev.filter((l) => l !== linha) : [...prev, linha],
      );
      const placas = linhaToPlacas.get(linha);
      if (!placas) return;
      setSelectedPlacas((prev) => {
        const isAdding = !selectedLinhas.includes(linha);
        if (isAdding) {
          const next = new Set(prev);
          placas.forEach((p) => next.add(p));
          return Array.from(next);
        }
        // Removendo: tira as placas dessa linha que não pertencem a nenhuma outra linha selecionada
        const remainingLinhas = selectedLinhas.filter((l) => l !== linha);
        const stillCovered = new Set<string>();
        for (const l of remainingLinhas) {
          linhaToPlacas.get(l)?.forEach((p) => stillCovered.add(p));
        }
        return prev.filter((p) => !placas.has(p) || stillCovered.has(p));
      });
    },
    [linhaToPlacas, selectedLinhas],
  );

  const handleSelectViagem = useCallback((idViagem: number | null) => {
    setSelectedViagemId((current) => (current === idViagem ? null : idViagem));
  }, []);

  const handleTogglePosicoes = useCallback((placa: string) => {
    setSelectedPosicoesPlacas((prev) =>
      prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
    );
  }, []);

  // Quando o usuário desseleciona uma placa (direta ou indireta via linha),
  // as posições daquela placa também devem sumir do mapa automaticamente.
  // `selectedPlacas` é nossa fonte de verdade — nada fora dela pode ficar
  // pendurado em `selectedPosicoesPlacas`.
  useEffect(() => {
    setSelectedPosicoesPlacas((prev) =>
      prev.filter((p) => selectedPlacas.includes(p)),
    );
  }, [selectedPlacas]);

  const handleToggleRotas = () => {
    setShowRotas((v) => {
      const next = !v;
      logSuccess('toggle rotas', { on: next });
      if (!next) setSelectedViagemId(null);
      return next;
    });
  };

  // -------- visibilidades efetivas
  const hasSelection = placasFiltradas.size > 0;

  const veiculosVisiveis = useMemo(() => {
    // Veículos COM rota sempre aparecem; os SEM rota só com o toggle ligado.
    const ativos: Veiculo[] = [
      ...veiculosComRota,
      ...(showSemRota ? veiculosSemRota : []),
    ];
    if (!hasSelection) return ativos;
    return ativos.filter((v) => v.placa != null && placasFiltradas.has(v.placa));
  }, [showSemRota, veiculosComRota, veiculosSemRota, hasSelection, placasFiltradas]);

  const rotasVisiveis = useMemo(() => {
    if (!hasSelection) return rotas;
    return rotas.filter((r) => r.placa != null && placasFiltradas.has(r.placa));
  }, [rotas, hasSelection, placasFiltradas]);

  const locaisVisiveis = useMemo(() => {
    if (!hasSelection) return locais;
    const idsViagemPermitidos = new Set<number>();
    for (const r of rotas) {
      if (r.placa && placasFiltradas.has(r.placa)) {
        idsViagemPermitidos.add(r.idViagem);
      }
    }
    return locais.filter((l) => idsViagemPermitidos.has(l.idViagem));
  }, [locais, rotas, hasSelection, placasFiltradas]);

  // Quando há seleção lateral, as polylines da seleção aparecem mesmo sem o
  // toggle "todas as rotas" ligado (regra do usuário: a rota do veículo
  // selecionado deve sempre aparecer).
  const showRotasEffective = showRotas || hasSelection;
  // Idem para locais
  const showLocaisEffective = showLocais || hasSelection;

  // Veículos selecionados (para montar uma ViagemEntradasTable por placa)
  const selectedVeiculos = useMemo(() => {
    if (!hasSelection) return [] as Veiculo[];
    return veiculosComRota.filter(
      (v) => v.placa != null && placasFiltradas.has(v.placa) && v.idViagem != null,
    );
  }, [veiculosComRota, hasSelection, placasFiltradas]);

  // Pares {idViagem, placa} para placas em que o usuário pediu para ver
  // as bolinhas de posição. Lookup direto em `veiculos` (não em
  // `veiculosComRota`) — se o veículo perdeu a flag temRota no meio do
  // caminho mas a placa continua selecionada para posições, ainda
  // queremos mostrar.
  const placasComPosicoes = useMemo(() => {
    const result: Array<{ idViagem: number; placa: string }> = [];
    for (const placa of selectedPosicoesPlacas) {
      const v = veiculos.find((x) => x.placa === placa && x.idViagem != null);
      if (v && v.idViagem != null) result.push({ idViagem: v.idViagem, placa });
    }
    return result;
  }, [selectedPosicoesPlacas, veiculos]);

  // Quando o usuário seleciona uma viagem pela tabela de rotas e essa viagem
  // tem placa, considere também essa placa como "selecionada" visualmente —
  // mas sem mexer no filtro lateral; só destaca a polyline (que pulsa).
  const refreshAll = () => {
    veiculosPoll.refetch();
    if (rotasPoll.data || rotasPoll.loading) rotasPoll.refetch();
    if (locaisPoll.data || locaisPoll.loading) locaisPoll.refetch();
  };

  const showBottomSection = (showRotas && rotasVisiveis.length > 0) || selectedVeiculos.length > 0;

  return (
    <AppLayout title="Monitoramento" subtitle="Operação ao vivo">
      <div className="flex h-full flex-col gap-3">
        {/* Barra superior: 3 blocos (esquerda / meio / direita) */}
        <section className="flex flex-wrap items-stretch gap-3">
          {/* Esquerda — relógio e atualização */}
          <div className="flex flex-col items-start gap-2">
            <ClockCard />
            <LastUpdateBadge
              lastUpdate={veiculosPoll.lastUpdate}
              intervalMs={POLL_VEICULOS_MS}
              loading={veiculosPoll.loading}
              error={veiculosPoll.error}
              onRefresh={refreshAll}
            />
          </div>

          {/* Meio — card informativo (sempre on) + toggle (sem rota) */}
          <div className="mx-auto flex flex-wrap items-center gap-2 self-center">
            <StatInfoCard
              icon={<CheckCircleIcon className="h-4 w-4" />}
              label="Veículos com rota hoje"
              value={veiculosComRota.length}
              hint="Sempre visíveis no mapa"
              variant="green"
              title="Veículos com rota são sempre exibidos e atualizados a cada 15s"
            />
            <StatToggleCard
              icon={<BanCircleIcon className="h-4 w-4" />}
              label="Veículos sem rota"
              count={veiculosSemRota.length}
              active={showSemRota}
              variant="slate"
              onToggle={() => setShowSemRota((v) => !v)}
              title={
                hasSelection
                  ? 'Indisponível enquanto houver placa ou linha selecionada'
                  : 'Clique para exibir/ocultar veículos sem rota'
              }
              disabled={hasSelection}
            />
          </div>

          {/* Direita — toggles de camadas. Ambos ficam desabilitados enquanto
              houver placa/linha selecionada: o filtro lateral já força as
              camadas correspondentes via `showRotasEffective` / `showLocaisEffective`. */}
          <div className="flex flex-col items-end gap-2">
            <ToggleChip
              active={showRotas}
              onClick={handleToggleRotas}
              disabled={hasSelection}
              label="Todas as rotas de hoje"
              count={showRotas ? rotas.length : undefined}
              icon={<RouteIcon className="h-3.5 w-3.5" />}
            />
            <ToggleChip
              active={showLocais}
              onClick={() => setShowLocais((v) => !v)}
              disabled={hasSelection}
              label="Todos os locais de hoje"
              count={showLocais ? countLocaisUnicos(locais) : undefined}
              icon={<PinIcon className="h-3.5 w-3.5" />}
            />
          </div>
        </section>

        {/* Área principal: filtro lateral + mapa */}
        <section className="flex min-h-[480px] flex-1 gap-3">
          <FiltrosLateral
            placas={placasDisponiveis}
            selectedPlacas={selectedPlacas}
            onTogglePlaca={handleTogglePlaca}
            selectedPosicoesPlacas={selectedPosicoesPlacas}
            onTogglePosicoes={handleTogglePosicoes}
            linhas={linhasDisponiveis}
            selectedLinhas={selectedLinhas}
            onToggleLinha={handleToggleLinha}
          />
          <div className="min-w-0 flex-1">
            <MapaMonitoramento
              veiculos={veiculosVisiveis}
              rotas={rotasVisiveis}
              locais={locaisVisiveis}
              showRotas={showRotasEffective}
              showLocais={showLocaisEffective}
              selectedViagemId={selectedViagemId}
              onSelectViagem={handleSelectViagem}
              onVisibleLocaisChange={handleVisibleLocaisChange}
              onMapReady={handleMapReady}
              posicoesPlacas={placasComPosicoes}
            />
          </div>
        </section>

        {showBottomSection && (
          <section className="flex flex-wrap gap-3">
            {showRotas && (
              <div className="min-w-[360px] flex-1">
                <RotasTable
                  rotas={rotasVisiveis}
                  loading={rotasPoll.loading}
                  error={rotasPoll.error}
                  selectedViagemId={selectedViagemId}
                  onSelectViagem={handleSelectViagem}
                />
              </div>
            )}
            {selectedVeiculos.map((v: Veiculo) => (
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
