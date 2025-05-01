import { useState, useEffect } from "react";
import useCommitteeStore, { CommitteeMember } from "../../../../../store/useCommitteeStore";
import CommitteeForm from "./CommitteeForm";
import CommitteeMembersTable from "./CommitteeMembersTable";
import { UserGroupIcon, UserPlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

const CommitteeManagement = () => {
  const { members, isLoading, error, fetchCommitteeMembers, deleteCommitteeMember } = useCommitteeStore();
  const [showForm, setShowForm] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<CommitteeMember | null>(null);

  useEffect(() => {
    fetchCommitteeMembers();
  }, [fetchCommitteeMembers]);

  const handleAddNewClick = () => {
    setMemberToEdit(null);
    setShowForm(true);
  };

  const handleEditMember = (member: CommitteeMember) => {
    setMemberToEdit(member);
    setShowForm(true);
  };

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteCommitteeMember(id);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el miembro del comité");
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setMemberToEdit(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setMemberToEdit(null);
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <UserGroupIcon className="h-8 w-8 mr-2 text-indigo-600 dark:text-indigo-400" />
            Gestión del Comité
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Administra los miembros del comité y sus preferencias de reportes
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleAddNewClick}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Agregar nuevo miembro
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Información sobre los reportes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Los miembros del comité recibirán reportes automáticamente según sus preferencias.
              Puedes configurar qué tipo de reportes recibirá cada miembro.
            </p>
          </div>
        </div>
      </div>

      {showForm ? (
        <CommitteeForm
          memberToEdit={memberToEdit}
          onSubmitSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <>
          {members.length === 0 && !isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-10 text-center">
              <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay miembros en el comité
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Comienza agregando el primer miembro al comité para gestionar los reportes.
              </p>
              <button
                onClick={handleAddNewClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Agregar primer miembro
              </button>
            </div>
          ) : (
            <CommitteeMembersTable
              members={members}
              isLoading={isLoading}
              onEdit={handleEditMember}
              onDelete={handleDeleteMember}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CommitteeManagement; 