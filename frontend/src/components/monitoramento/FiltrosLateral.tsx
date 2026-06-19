import { type ReactNode, useRef } from 'react';
import { LinhasFilterCard } from './LinhasFilterCard';
import { PlacasFilterCard, type FilterCardHandle } from './PlacasFilterCard';

interface FiltrosLateralProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
  selectedPosicoesPlacas: string[];
  onTogglePosicoes: (placa: string) => void;
  linhas: string[];
  selectedLinhas: string[];
  onToggleLinha: (linha: string) => void;
  /** Cores da paleta (azul = 1ª) por placa/linha selecionada. */
  colorByPlaca: Map<string, string>;
  colorByLinha: Map<string, string>;
  /** Mapeamentos placa↔linha, usados para centralizar o correspondente ao clicar. */
  placaToLinhas: Map<string, Set<string>>;
  linhaToPlacas: Map<string, Set<string>>;
  /** Mapa renderizado ENTRE os dois cards: placas à esquerda, mapa, linhas à
   *  direita. Vem como children para a coordenação de scroll placa↔linha (que
   *  precisa dos dois refs) seguir encapsulada aqui. */
  children: ReactNode;
}

export function FiltrosLateral({
  placas,
  selectedPlacas,
  onTogglePlaca,
  selectedPosicoesPlacas,
  onTogglePosicoes,
  linhas,
  selectedLinhas,
  onToggleLinha,
  colorByPlaca,
  colorByLinha,
  placaToLinhas,
  linhaToPlacas,
  children,
}: FiltrosLateralProps) {
  const placasRef = useRef<FilterCardHandle>(null);
  const linhasRef = useRef<FilterCardHandle>(null);

  // Ao clicar numa placa, centraliza a linha correspondente no card de linhas
  // (e vice-versa) — assim o usuário não precisa rolar pra achar o par.
  const handleTogglePlaca = (placa: string) => {
    onTogglePlaca(placa);
    const linha = placaToLinhas.get(placa)?.values().next().value;
    if (linha) linhasRef.current?.scrollToItem(linha);
  };
  const handleToggleLinha = (linha: string) => {
    onToggleLinha(linha);
    const placa = linhaToPlacas.get(linha)?.values().next().value;
    if (placa) placasRef.current?.scrollToItem(placa);
  };

  // Layout em 3 colunas no desktop (lg): placas | mapa | linhas. Como são
  // irmãos no flex-row da seção pai (align-items: stretch), cada aside estica
  // para a altura da linha — ou seja, a MESMA altura do mapa. No mobile a seção
  // é flex-col: as duas strips de filtro ficam no topo (order 1/2) e o mapa-herói
  // logo abaixo (order 3), preservando o layout do #45.
  return (
    <>
      {/* Placas — coluna esquerda */}
      <aside className="order-1 flex w-full shrink-0 flex-col lg:w-56 lg:min-h-0 lg:overflow-hidden">
        <PlacasFilterCard
          ref={placasRef}
          placas={placas}
          selectedPlacas={selectedPlacas}
          onTogglePlaca={handleTogglePlaca}
          selectedPosicoesPlacas={selectedPosicoesPlacas}
          onTogglePosicoes={onTogglePosicoes}
          colorByPlaca={colorByPlaca}
        />
      </aside>

      {children}

      {/* Linhas/rotas — coluna direita no desktop; strip abaixo das placas no mobile */}
      <aside className="order-2 flex w-full shrink-0 flex-col lg:order-3 lg:w-56 lg:min-h-0 lg:overflow-hidden">
        <LinhasFilterCard
          ref={linhasRef}
          linhas={linhas}
          selectedLinhas={selectedLinhas}
          onToggleLinha={handleToggleLinha}
          colorByLinha={colorByLinha}
        />
      </aside>
    </>
  );
}
