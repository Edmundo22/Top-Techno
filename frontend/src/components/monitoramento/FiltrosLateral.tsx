import { LinhasFilterCard } from './LinhasFilterCard';
import { PlacasFilterCard } from './PlacasFilterCard';

interface FiltrosLateralProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
  linhas: string[];
  selectedLinhas: string[];
  onToggleLinha: (linha: string) => void;
}

export function FiltrosLateral({
  placas,
  selectedPlacas,
  onTogglePlaca,
  linhas,
  selectedLinhas,
  onToggleLinha,
}: FiltrosLateralProps) {
  return (
    <aside className="flex w-32 shrink-0 flex-col gap-2 overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <PlacasFilterCard
          placas={placas}
          selectedPlacas={selectedPlacas}
          onTogglePlaca={onTogglePlaca}
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
