import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { MapaHistorico } from '../components/historico/MapaHistorico';
import { PlacasList } from '../components/historico/PlacasList';
import { ToggleChip } from '../components/monitoramento/ToggleChip';
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
  const [showPosicoes, setShowPosicoes] = useState(true);
  const [showRotas, setShowRotas] = useState(false);
  const [showLocais, setShowLocais] = useState(false);
  const [selectedPlacas, setSelectedPlacas] = useState<string[]>([]);

  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [rotas, setRotas] = useState<RotaHistorico[]>([]);
  const [locais, setLocais] = useState<LocalHistorico[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataSelecionada) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedPlacas([]);

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
        <section className="flex flex-wrap items-center justify-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink shadow-card">
            <span className="text-brand-ink-muted">Data:</span>
            <input
              type="date"
              value={dataSelecionada}
              max={todayIso()}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="border-0 bg-transparent text-xs font-semibold text-brand-ink focus:outline-none"
            />
          </label>

          <span className="mx-1 h-4 w-px bg-brand-line" aria-hidden />

          <ToggleChip
            active={showPosicoes}
            onClick={handleTogglePosicoes}
            label="Posições"
            count={showPosicoes ? posicoes.length : undefined}
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
            count={showLocais ? countLocaisUnicos : undefined}
          />

          {loading && (
            <span className="text-xs text-brand-ink-muted">Carregando…</span>
          )}
          {error && (
            <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
              {error}
            </span>
          )}
        </section>

        <section className="flex min-h-[480px] flex-1 gap-3">
          <PlacasList
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
      </div>
    </AppLayout>
  );
}
