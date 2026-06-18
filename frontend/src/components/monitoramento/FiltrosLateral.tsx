import { useRef } from 'react';
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

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-56">
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <PlacasFilterCard
          ref={placasRef}
          placas={placas}
          selectedPlacas={selectedPlacas}
          onTogglePlaca={handleTogglePlaca}
          selectedPosicoesPlacas={selectedPosicoesPlacas}
          onTogglePosicoes={onTogglePosicoes}
          colorByPlaca={colorByPlaca}
        />
      </div>
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <LinhasFilterCard
          ref={linhasRef}
          linhas={linhas}
          selectedLinhas={selectedLinhas}
          onToggleLinha={handleToggleLinha}
          colorByLinha={colorByLinha}
        />
      </div>
    </aside>
  );
}
