import { useState } from "react";
import { CommitteeMember } from "../../../../../store/useCommitteeStore";
import {
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";

interface CommitteeMembersTableProps {
  members: CommitteeMember[];
  isLoading: boolean;
  onEdit: (member: CommitteeMember) => void;
  onDelete: (id: string) => void;
}

const CommitteeMembersTable = ({
  members,
  isLoading,
  onEdit,
  onDelete,
}: CommitteeMembersTableProps) => {
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setMemberToDelete(id);
  };

  const confirmDelete = async () => {
    if (memberToDelete) {
      try {
        await onDelete(memberToDelete);
        toast.success("Miembro eliminado correctamente");
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar el miembro");
      } finally {
        setMemberToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setMemberToDelete(null);
  };

  // Renderizar el modal de confirmación
  const renderDeleteConfirmation = () => {
    if (!memberToDelete) return null;

    const member = members.find(m => m.id === memberToDelete);
    if (!member) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Confirmar eliminación
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            ¿Estás seguro de que deseas eliminar a <strong>{member.firstName} {member.lastName}</strong> del comité?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {renderDeleteConfirmation()}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Miembro
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Contacto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Cargo
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Reportes
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Cargando miembros del comité...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No hay miembros del comité registrados
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {member.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {member.email}
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="grid grid-cols-1 gap-y-1">
                      <div className="flex items-center text-xs">
                        {member.reportsPreferences.maintenance ? (
                          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">Mantenimiento</span>
                      </div>
                      <div className="flex items-center text-xs">
                        {member.reportsPreferences.financialReports ? (
                          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">Ingresos y Egresos</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(member)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(member.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommitteeMembersTable; 