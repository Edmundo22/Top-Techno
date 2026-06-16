import { LinhasFilterCard } from './LinhasFilterCard';
import { PlacasFilterCard } from './PlacasFilterCard';

interface FiltrosLateralProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
  selectedPosicoesPlacas: string[];
  onTogglePosicoes: (placa: string) => void;
  linhas: string[];
  selectedLinhas: string[];
  onToggleLinha: (linha: string) => void;
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
}: FiltrosLateralProps) {
  return (
    <aside className="flex h-[40vh] w-full shrink-0 flex-col gap-2 overflow-hidden lg:h-auto lg:w-40">
      <div className="min-h-0 flex-1 overflow-hidden">
        <PlacasFilterCard
          placas={placas}
          selectedPlacas={selectedPlacas}
          onTogglePlaca={onTogglePlaca}
          selectedPosicoesPlacas={selectedPosicoesPlacas}
          onTogglePosicoes={onTogglePosicoes}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <LinhasFilterCard
          linhas={linhas}
          selectedLinhas={selectedLinhas}
          onToggleLinha={onToggleLinha}
        />
      </div>
    </aside>
  );
}
