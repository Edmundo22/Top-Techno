import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MapaHistorico } from '../components/historico/MapaHistorico';
import { ClockCard } from '../components/monitoramento/ClockCard';
import { PlacasFilterCard } from '../components/monitoramento/PlacasFilterCard';
import { StatToggleCard } from '../components/monitoramento/StatToggleCard';
import { ToggleChip } from '../components/monitoramento/ToggleChip';
import {
  BanCircleIcon,
  CarIcon,
  ClockIcon,
  PinIcon,
  RouteIcon,
} from '../components/ui/icons';
import { extractErrorMessage } from '../services/api';
import {
  type LocalHistorico,
  type Posicao,
  type RotaHistorico,
  fetchLocaisHistorico,
  fetchPosicoesHistorico,
  fetchRotasHistorico,
} from '../services/historicoApi';
import { logError, logSuccess } from '../utils/logger';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function HistoricoPage() {
  const [dataSelecionada, setDataSelecionada] = useState<string>(todayIso());
  // Default OFF: usuário pediu para o mapa abrir vazio — só plota quando ele
  // filtra (toggle "Posições do dia" ou escolhe uma placa).
  const [showPosicoes, setShowPosicoes] = useState(false);
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  const [selectedPlacas, setSelectedPlacas] = useState<string[]>([]);

  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [rotas, setRotas] = useState<RotaHistorico[]>([]);
  const [locais, setLocais] = useState<LocalHistorico[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (!dataSelecionada) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedPlacas([]);
    // Trocar de data sempre reseta para "vazio" — o usuário precisa optar
    // novamente por mostrar posições do novo dia.
    setShowPosicoes(false);

    Promise.all([
      fetchPosicoesHistorico(dataSelecionada),
      fetchRotasHistorico(dataSelecionada),
      fetchLocaisHistorico(dataSelecionada),
    ])
      .then(([p, r, l]) => {
        if (cancelled) return;
        setPosicoes(p);
        setRotas(r);
        setLocais(l);
        setLastLoaded(dataSelecionada);
        logSuccess('histórico carregado', {
          data: dataSelecionada,
          posicoes: p.length,
          rotas: r.length,
          locais: l.length,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        logError('carregar histórico', err, { data: dataSelecionada });
        setError(extractErrorMessage(err, 'Falha ao carregar histórico.'));
        setPosicoes([]);
        setRotas([]);
        setLocais([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataSelecionada]);

  const countLocaisUnicos = useMemo(
    () => new Set(locais.map((l) => l.idLocal)).size,
    [locais],
  );

  const placasAtivas = useMemo(() => {
    const set = new Set<string>();
    for (const p of posicoes) {
      if (p.placa) set.add(p.placa);
    }
    return Array.from(set).sort();
  }, [posicoes]);

  const posicoesFiltradas = useMemo(() => {
    if (showPosicoes) return posicoes;
    if (selectedPlacas.length === 0) return [];
    const selected = new Set(selectedPlacas);
    return posicoes.filter((p) => p.placa != null && selected.has(p.placa));
  }, [posicoes, showPosicoes, selectedPlacas]);

  const handleTogglePosicoes = useCallback(() => {
    setShowPosicoes((prev) => {
      const next = !prev;
      if (next) setSelectedPlacas([]);
      return next;
    });
  }, []);

  const handleTogglePlaca = useCallback((placa: string) => {
    setShowPosicoes(false);
    setSelectedPlacas((prev) =>
      prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
    );
  }, []);

  const posicoesVisiveis = showPosicoes || selectedPlacas.length > 0;

  return (
    <AppLayout title="Histórico" subtitle="Reveja os dados de um dia passado">
      <div className="flex h-full flex-col gap-3">
        {/* Barra superior: 3 blocos (esquerda / meio / direita) — mesmo padrão da
            tela de Monitoramento. Aqui o seletor de data faz o papel do
            "controle principal" no canto esquerdo. */}
        <section className="flex flex-wrap items-stretch gap-3">
          {/* Esquerda — seletor de data + relógio */}
          <div className="flex flex-col items-start gap-2">
            <label className="inline-flex h-9 items-center gap-2 rounded-full border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink shadow-card">
              <ClockIcon className="h-3.5 w-3.5 text-brand-ink-soft" />
              <span className="text-brand-ink-muted">Data:</span>
              <input
                type="date"
                value={dataSelecionada}
                max={todayIso()}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="border-0 bg-transparent text-xs font-semibold text-brand-ink focus:outline-none"
              />
              {loading && (
                <span className="text-[10px] uppercase tracking-wider text-brand-ink-muted">
                  carregando…
                </span>
              )}
            </label>
            <ClockCard />
          </div>

          {/* Meio — cards informativos com toggle */}
          <div className="mx-auto flex flex-wrap items-center gap-2 self-center">
            <StatToggleCard
              icon={
                showPosicoes ? (
                  <CarIcon className="h-4 w-4" />
                ) : (
                  <BanCircleIcon className="h-4 w-4" />
                )
              }
              label="Posições do dia"
              count={posicoes.length}
              active={showPosicoes}
              variant="green"
              onToggle={handleTogglePosicoes}
              title="Liga/desliga as posições de todos os veículos do dia"
            />
            <StatToggleCard
              icon={<CarIcon className="h-4 w-4" />}
              label="Placas ativas no dia"
              count={placasAtivas.length}
              active={selectedPlacas.length > 0}
              variant="accent"
              onToggle={() => {
                // Como atalho: se já tem placas selecionadas, limpa;
                // senão liga "Posições do dia" para o usuário ver tudo.
                if (selectedPlacas.length > 0) {
                  setSelectedPlacas([]);
                } else {
                  setShowPosicoes(true);
                }
              }}
              title="Mostra quantas placas reportaram posição nesta data"
            />
          </div>

          {/* Direita — toggles de camadas */}
          <div className="flex flex-col items-end gap-2">
            <ToggleChip
              active={showRotas}
              onClick={() => setShowRotas((v) => !v)}
              label="Todas as rotas do dia"
              count={showRotas ? rotas.length : undefined}
              icon={<RouteIcon className="h-3.5 w-3.5" />}
            />
            <ToggleChip
              active={showLocais}
              onClick={() => setShowLocais((v) => !v)}
              label="Todos os locais do dia"
              count={showLocais ? countLocaisUnicos : undefined}
              icon={<PinIcon className="h-3.5 w-3.5" />}
            />
          </div>
        </section>

        {error && (
          <div className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <section className="flex min-h-[480px] flex-1 gap-3">
          <PlacasFilterCard
            placas={placasAtivas}
            selectedPlacas={selectedPlacas}
            onTogglePlaca={handleTogglePlaca}
          />
          <div className="min-w-0 flex-1">
            <MapaHistorico
              posicoes={posicoesFiltradas}
              rotas={rotas}
              locais={locais}
              showPosicoes={posicoesVisiveis}
              showRotas={showRotas}
              showLocais={showLocais}
            />
          </div>
        </section>

        {!loading && lastLoaded && !posicoesVisiveis && !showRotas && !showLocais && (
          <div className="rounded-card border border-brand-line bg-brand-line-soft px-4 py-3 text-xs text-brand-ink-muted">
            Mapa vazio. Use os controles acima para mostrar <strong>posições</strong>,
            <strong> rotas</strong> ou <strong>locais</strong> deste dia — ou clique numa
            placa no filtro lateral.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
