import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlusIcon, SearchIcon } from '../components/ui/icons';
import { MotoristasTable } from '../components/cadastros/motoristas/MotoristasTable';
import { MotoristaFormModal } from '../components/cadastros/motoristas/MotoristaFormModal';
import { RotaSelectMapCard } from '../components/cadastros/motoristas/RotaSelectMapCard';
import { VinculadosTable } from '../components/cadastros/motoristas/VinculadosTable';
import { DisponiveisCard } from '../components/cadastros/motoristas/DisponiveisCard';
import { motoristasApi, type MotoristaDTO } from '../services/motoristasApi';
import {
  motoristaRotaApi,
  type DisponivelDTO,
  type RotaFtDTO,
  type VinculadoDTO,
} from '../services/motoristaRotaApi';
import { extractErrorMessage } from '../services/api';
import { logError, logSuccess } from '../utils/logger';

export function MotoristaPorRotaPage() {
  const [motoristas, setMotoristas] = useState<MotoristaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MotoristaDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MotoristaDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Coluna direita — rotas + seleção + vínculos
  const [rotas, setRotas] = useState<RotaFtDTO[]>([]);
  const [rotasLoading, setRotasLoading] = useState(false);
  const [selectedIdFt, setSelectedIdFt] = useState<number | null>(null);
  const [vinculados, setVinculados] = useState<VinculadoDTO[]>([]);
  const [vinculadosLoading, setVinculadosLoading] = useState(false);
  const [linkBusyId, setLinkBusyId] = useState<number | null>(null);
  const [confirmDesvincular, setConfirmDesvincular] = useState<VinculadoDTO | null>(null);
  const [desvincularError, setDesvincularError] = useState<string | null>(null);
  const [confirmTitular, setConfirmTitular] = useState<VinculadoDTO | null>(null);
  const [titularError, setTitularError] = useState<string | null>(null);
  const [disponiveis, setDisponiveis] = useState<DisponivelDTO[]>([]);
  const [disponiveisLoading, setDisponiveisLoading] = useState(false);
  const [vincularSubmitting, setVincularSubmitting] = useState(false);

  const fetchMotoristas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await motoristasApi.list();
      setMotoristas(data);
      logSuccess('motoristas carregados', { total: data.length });
    } catch (err) {
      logError('list motoristas', err);
      setLoadError(extractErrorMessage(err, 'Falha ao carregar motoristas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRotas = useCallback(async () => {
    setRotasLoading(true);
    try {
      const data = await motoristaRotaApi.listRotas();
      setRotas(data);
      logSuccess('rotas carregadas', { total: data.length });
    } catch (err) {
      logError('list rotas', err);
    } finally {
      setRotasLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMotoristas();
    fetchRotas();
  }, [fetchMotoristas, fetchRotas]);

  // Recarrega vinculados + disponíveis da rota (fonte de verdade no pai, para
  // que titular/desvincular/vincular reflitam imediatamente nos dois cards).
  const refreshLinks = useCallback(async (idFt: number) => {
    setVinculadosLoading(true);
    setDisponiveisLoading(true);
    try {
      const [vinc, disp] = await Promise.all([
        motoristaRotaApi.listVinculados(idFt),
        motoristaRotaApi.listDisponiveis(idFt),
      ]);
      setVinculados(vinc);
      setDisponiveis(disp);
    } catch (err) {
      logError('list vinculos', err);
    } finally {
      setVinculadosLoading(false);
      setDisponiveisLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIdFt == null) {
      setVinculados([]);
      setDisponiveis([]);
      return;
    }
    refreshLinks(selectedIdFt);
  }, [selectedIdFt, refreshLinks]);

  // Titular atual da rota (se houver) — usado pra montar a mensagem de troca.
  const currentTitular = vinculados.find((x) => x.titular) ?? null;

  const titularModalMessage = (() => {
    if (!confirmTitular) return '';
    const nome = confirmTitular.motorista ?? '';
    if (confirmTitular.titular) {
      return `Deseja remover "${nome}" como titular desta rota?`;
    }
    if (currentTitular && currentTitular.idCadMot !== confirmTitular.idCadMot) {
      return `Deseja trocar o "${currentTitular.motorista ?? ''}" pelo "${nome}"?`;
    }
    return `Deseja deixar "${nome}" como titular desta rota?`;
  })();

  const handleConfirmTitular = async () => {
    if (!confirmTitular || selectedIdFt == null) return;
    const alvo = confirmTitular;
    setLinkBusyId(alvo.idCadMotRota);
    setTitularError(null);
    try {
      await motoristaRotaApi.setTitular(selectedIdFt, alvo.idCadMot, !alvo.titular);
      logSuccess('titular atualizado', { idCadMot: alvo.idCadMot, titular: !alvo.titular });
      setConfirmTitular(null);
      await refreshLinks(selectedIdFt);
    } catch (err) {
      logError('set titular', err);
      setTitularError(extractErrorMessage(err, 'Falha ao atualizar titular.'));
    } finally {
      setLinkBusyId(null);
    }
  };

  const handleVincular = async (idsCadMot: number[]) => {
    if (selectedIdFt == null || idsCadMot.length === 0) return;
    setVincularSubmitting(true);
    try {
      await motoristaRotaApi.vincular(selectedIdFt, idsCadMot);
      logSuccess('motoristas vinculados', { idFt: selectedIdFt, total: idsCadMot.length });
      await refreshLinks(selectedIdFt);
    } catch (err) {
      logError('vincular', err);
    } finally {
      setVincularSubmitting(false);
    }
  };

  const handleConfirmDesvincular = async () => {
    if (!confirmDesvincular || selectedIdFt == null) return;
    setLinkBusyId(confirmDesvincular.idCadMotRota);
    setDesvincularError(null);
    try {
      await motoristaRotaApi.desvincular(confirmDesvincular.idCadMotRota);
      logSuccess('motorista desvinculado', { idCadMotRota: confirmDesvincular.idCadMotRota });
      setConfirmDesvincular(null);
      await refreshLinks(selectedIdFt);
    } catch (err) {
      logError('desvincular', err);
      setDesvincularError(extractErrorMessage(err, 'Falha ao desvincular motorista.'));
    } finally {
      setLinkBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (motorista: MotoristaDTO) => {
    setEditing(motorista);
    setShowForm(true);
  };

  const handleSaved = (motorista: MotoristaDTO) => {
    setMotoristas((prev) => {
      const exists = prev.some((m) => m.idCadMot === motorista.idCadMot);
      return exists
        ? prev.map((m) => (m.idCadMot === motorista.idCadMot ? motorista : m))
        : [motorista, ...prev];
    });
    setShowForm(false);
    setEditing(null);
    // Vinculados/disponíveis mostram nome+CNH (join com APP_CAD_MOT): recarrega
    // para refletir o motorista novo/editado nos dois cards da rota selecionada.
    if (selectedIdFt != null) void refreshLinks(selectedIdFt);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await motoristasApi.remove(confirmDelete.idCadMot);
      setMotoristas((prev) => prev.filter((m) => m.idCadMot !== confirmDelete.idCadMot));
      logSuccess('motorista excluído', { idCadMot: confirmDelete.idCadMot });
      setConfirmDelete(null);
      // Recarrega os cards da rota (o motorista some dos disponíveis).
      if (selectedIdFt != null) await refreshLinks(selectedIdFt);
    } catch (err) {
      logError('delete motorista', err);
      setDeleteError(extractErrorMessage(err, 'Falha ao excluir motorista.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout
      title="Cadastros / Motorista por Rota"
      subtitle="Cadastro de motoristas e vínculo com rotas"
    >
      <div className="flex flex-col gap-3 lg:h-[calc(100vh-140px)] lg:min-h-0 lg:flex-row">
        {/* Coluna esquerda — CRUD de motoristas */}
        <div className="flex min-h-[55vh] flex-1 flex-col gap-3 lg:min-h-0 lg:basis-[45%]">
          <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-card border border-brand-line bg-white px-3 py-3 shadow-card sm:px-4">
            <label className="relative flex w-full items-center sm:w-auto">
              <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-brand-ink-muted" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Filtro universal…"
                className="h-9 w-full rounded-md border border-brand-line bg-white pl-9 pr-3 text-xs text-brand-ink outline-none placeholder:text-brand-ink-muted/70 transition-colors hover:border-brand-ink-soft focus:border-brand-accent sm:w-56"
              />
            </label>

            {loadError && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                {loadError}
              </span>
            )}

            <div className="ml-auto shrink-0">
              <Button onClick={openCreate}>
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Novo motorista</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <MotoristasTable
              motoristas={motoristas}
              loading={loading}
              globalFilter={globalFilter}
              onEdit={openEdit}
              onDelete={(m) => {
                setDeleteError(null);
                setConfirmDelete(m);
              }}
            />
          </div>
        </div>

        {/* Coluna direita — vínculo motorista↔rota */}
        <div className="flex min-h-[80vh] flex-1 flex-col gap-3 lg:min-h-0 lg:basis-[55%]">
          {/* Rota + mini-mapa — 2/5 da altura */}
          <div className="min-h-0 basis-2/5">
            <RotaSelectMapCard
              rotas={rotas}
              loading={rotasLoading}
              selectedIdFt={selectedIdFt}
              onSelect={setSelectedIdFt}
            />
          </div>

          {/* Vinculados (mais largo) + Disponíveis (mais estreito) lado a lado — 3/5 */}
          <div className="min-h-0 basis-3/5">
            {selectedIdFt == null ? (
              <div className="grid h-full place-items-center rounded-card border border-dashed border-brand-line bg-brand-line-soft/40 p-6 text-center text-sm text-brand-ink-muted">
                Selecione uma rota para gerenciar os motoristas vinculados.
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col gap-3 sm:flex-row">
                <div className="min-h-0 min-w-0 basis-[60%]">
                  <VinculadosTable
                    vinculados={vinculados}
                    loading={vinculadosLoading}
                    busyId={linkBusyId}
                    onToggleTitular={(v) => {
                      setTitularError(null);
                      setConfirmTitular(v);
                    }}
                    onDesvincular={(v) => {
                      setDesvincularError(null);
                      setConfirmDesvincular(v);
                    }}
                  />
                </div>
                <div className="min-h-0 min-w-0 basis-[40%]">
                  <DisponiveisCard
                    key={selectedIdFt}
                    disponiveis={disponiveis}
                    loading={disponiveisLoading}
                    submitting={vincularSubmitting}
                    onVincular={handleVincular}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MotoristaFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
        submit={(body) =>
          editing ? motoristasApi.update(editing.idCadMot, body) : motoristasApi.create(body)
        }
      />

      <Modal
        open={confirmDelete != null}
        onClose={() => {
          if (!deleting) {
            setConfirmDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir motorista"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={deleting}
              onClick={() => {
                setConfirmDelete(null);
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-ink">
          Tem certeza que deseja excluir o motorista{' '}
          <strong>{confirmDelete?.motorista ?? `#${confirmDelete?.idCadMot ?? ''}`}</strong>? Essa
          ação não pode ser desfeita.
        </p>
        {deleteError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {deleteError}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDesvincular != null}
        onClose={() => {
          if (linkBusyId == null) {
            setConfirmDesvincular(null);
            setDesvincularError(null);
          }
        }}
        title="Desvincular motorista"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={linkBusyId != null}
              onClick={() => {
                setConfirmDesvincular(null);
                setDesvincularError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDesvincular}
              disabled={linkBusyId != null}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              {linkBusyId != null ? 'Desvinculando…' : 'Desvincular'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-ink">
          Tem certeza que deseja retirar o vínculo do motorista{' '}
          <strong>{confirmDesvincular?.motorista ?? ''}</strong> desta rota? Ele voltará a aparecer
          como disponível para vínculo.
        </p>
        {desvincularError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {desvincularError}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmTitular != null}
        onClose={() => {
          if (linkBusyId == null) {
            setConfirmTitular(null);
            setTitularError(null);
          }
        }}
        title="Titular da rota"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={linkBusyId != null}
              onClick={() => {
                setConfirmTitular(null);
                setTitularError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmTitular} disabled={linkBusyId != null}>
              {linkBusyId != null ? 'Salvando…' : 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-ink">{titularModalMessage}</p>
        {titularError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {titularError}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
