// src/presentation/screens/dashboard/projects/components/MilestonesList.tsx
import React from "react";
import { toast } from "react-hot-toast";
import {
  useProjectMilestoneStore,
  MilestoneStatus,
  ProjectMilestone,
} from "../../../../../store/projectMilestoneStore";
import {
  CheckIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import ActionModal from "../../../../components/shared/modals/ActionModal";

interface MilestonesListProps {
  projectId: string;
}

const MilestonesList: React.FC<MilestonesListProps> = ({ projectId }) => {
  const { milestones, fetchMilestones, updateMilestone, deleteMilestone } =
    useProjectMilestoneStore();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [milestoneToDelete, setMilestoneToDelete] =
    React.useState<ProjectMilestone | null>(null);

  React.useEffect(() => {
    fetchMilestones(projectId);
  }, [projectId, fetchMilestones]);

  const toggleStatus = async (m: ProjectMilestone) => {
    const newStatus =
      m.status === MilestoneStatus.PENDING
        ? MilestoneStatus.COMPLETED
        : MilestoneStatus.PENDING;
    try {
      await updateMilestone(m.id, { status: newStatus });
      const updateError = useProjectMilestoneStore.getState().error;
      if (updateError) {
        toast.error(updateError);
        return;
      }
      toast.success(
        newStatus === MilestoneStatus.COMPLETED
          ? "Hito marcado como completado."
          : "Hito reabierto correctamente."
      );
    } catch {
      toast.error("No se pudo actualizar el estado del hito.");
    }
  };

  const handleDeleteClick = (milestone: ProjectMilestone) => {
    setMilestoneToDelete(milestone);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!milestoneToDelete) {
      return;
    }

    try {
      await deleteMilestone(milestoneToDelete.id);
      const deleteError = useProjectMilestoneStore.getState().error;
      if (deleteError) {
        toast.error(deleteError);
        return;
      }
      toast.success("Hito eliminado correctamente.");
    } catch {
      toast.error("No se pudo eliminar el hito.");
    } finally {
      setMilestoneToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {milestones.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No hay hitos registrados para este proyecto. Usa "Nuevo Hito" para
          crear el primero.
        </div>
      )}
      {milestones.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded shadow"
        >
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {m.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{m.date}</p>
          </div>
          <div className="flex gap-2">
            {m.status === MilestoneStatus.PENDING ? (
              <button
                onClick={() => toggleStatus(m)}
                className="flex items-center space-x-1 px-2 py-1 text-sm font-medium rounded-md bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 text-green-800 dark:text-green-200"
                title="Marcar como completado"
                aria-label="Marcar como completado"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Completar</span>
              </button>
            ) : (
              <button
                onClick={() => toggleStatus(m)}
                className="flex items-center space-x-1 px-2 py-1 text-sm font-medium rounded-md bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                title="Reabrir hito"
                aria-label="Reabrir hito"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Reabrir</span>
              </button>
            )}
            <button
              onClick={() => handleDeleteClick(m)}
              className="flex items-center space-x-1 px-2 py-1 text-sm font-medium rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200"
              title="Eliminar hito"
              aria-label="Eliminar hito"
            >
              <TrashIcon className="h-4 w-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      ))}

      <ActionModal
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        title="Eliminar hito"
        message={
          milestoneToDelete
            ? `Se eliminara el hito "${milestoneToDelete.title}". Esta accion no se puede deshacer.`
            : "Esta accion no se puede deshacer."
        }
        onConfirm={handleConfirmDelete}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        showCancel
        variant="danger"
      />
    </div>
  );
};

export default MilestonesList;
