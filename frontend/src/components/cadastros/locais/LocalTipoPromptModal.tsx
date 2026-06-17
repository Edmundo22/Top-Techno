import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Modal } from '../../ui/Modal';
import { CircleIcon, PolygonOutlineIcon } from '../../ui/icons';
import type { TipoLocal } from '../../../services/locaisApi';

interface LocalTipoPromptModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  currentTipo?: TipoLocal; // obrigatório no modo 'edit'
  codigoPonto?: string | null;
  onChoose: (tipo: TipoLocal) => void;
}

const TIPO_ICON: Record<TipoLocal, ComponentType<SVGProps<SVGSVGElement>>> = {
  1: CircleIcon,
  2: PolygonOutlineIcon,
};
const TIPO_NOME: Record<TipoLocal, string> = { 1: 'Círculo', 2: 'Polígono' };

function OptionButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-2 rounded-card border border-brand-line bg-white px-4 py-5 text-center shadow-card transition-colors hover:border-brand-accent hover:bg-brand-accent-soft"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-line-soft text-brand-ink-soft">
        {icon}
      </span>
      <span className="text-sm font-semibold text-brand-ink">{title}</span>
      <span className="text-[11px] text-brand-ink-muted">{description}</span>
    </button>
  );
}

export function LocalTipoPromptModal({
  open,
  onClose,
  mode,
  currentTipo,
  codigoPonto,
  onChoose,
}: LocalTipoPromptModalProps) {
  const isEdit = mode === 'edit';
  const other: TipoLocal = currentTipo === 1 ? 2 : 1;
  const KeepIcon = currentTipo ? TIPO_ICON[currentTipo] : CircleIcon;
  const ChangeIcon = TIPO_ICON[other];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        isEdit ? `Editar local — ${codigoPonto ?? ''}` : 'Como deseja cadastrar o local?'
      }
    >
      <p className="mb-4 text-xs text-brand-ink-muted">
        {isEdit
          ? 'Mantenha o formato atual ou troque para o outro. Ao trocar, os dados do formato anterior são substituídos.'
          : 'Escolha o formato do local. Depois você desenha o círculo (centro + raio) ou o polígono no mapa.'}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {isEdit && currentTipo ? (
          <>
            <OptionButton
              icon={<KeepIcon className="h-6 w-6" />}
              title={`Manter formato (${TIPO_NOME[currentTipo]})`}
              description="Edita os dados sem mudar o formato cadastrado."
              onClick={() => onChoose(currentTipo)}
            />
            <OptionButton
              icon={<ChangeIcon className="h-6 w-6" />}
              title={`Alterar para ${TIPO_NOME[other]}`}
              description={`Troca o formato; os dados de ${TIPO_NOME[currentTipo].toLowerCase()} são removidos.`}
              onClick={() => onChoose(other)}
            />
          </>
        ) : (
          <>
            <OptionButton
              icon={<CircleIcon className="h-6 w-6" />}
              title="Círculo"
              description="Centro no mapa + raio em metros."
              onClick={() => onChoose(1)}
            />
            <OptionButton
              icon={<PolygonOutlineIcon className="h-6 w-6" />}
              title="Polígono"
              description="Área desenhada com vértices no mapa."
              onClick={() => onChoose(2)}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
