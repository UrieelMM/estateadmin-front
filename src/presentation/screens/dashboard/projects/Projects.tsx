import React, { useEffect, useState } from "react";
import { useProjectStore } from "../../../../store/projectStore";
import { toast } from "react-hot-toast";
import NewProjectButton from "./NewProjectButton";
import NewProjectModal from "./NewProjectModal";
import ProjectDashboard from "./ProjectDashboard";
import ProjectSelector from "./ProjectSelector";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";

const Projects: React.FC = () => {
  const {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProjectById,
  } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Obtener los proyectos al montar el componente
  useEffect(() => {
    const condominiumId = localStorage.getItem("condominiumId");
    if (condominiumId) {
      fetchProjects(condominiumId);
    }
  }, [fetchProjects]);

  // Seleccionar el primer proyecto por defecto cuando se cargan
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      fetchProjectById(projects[0].id);
    }
  }, [projects, selectedProjectId, fetchProjectById]);

  // Manejar el cambio de proyecto seleccionado
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    fetchProjectById(projectId);
  };

  // Manejar la apertura y cierre del modal para nuevo proyecto
  const handleOpenNewProjectModal = () => setIsNewProjectModalOpen(true);
  const handleCloseNewProjectModal = () => setIsNewProjectModalOpen(false);

  // Manejar la creación de un nuevo proyecto (se implementará en el modal)
  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
    fetchProjectById(projectId);
    toast.success("Proyecto creado exitosamente");
  };

  if (error) {
    toast.error(error);
  }

  return (
    <div className="py-4 px-2">
      <div className="flex flex-col px-6 sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Gestión de Proyectos
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectChange={handleProjectChange}
            loading={loading}
          />
          <NewProjectButton onClick={handleOpenNewProjectModal} />
        </div>
      </div>

      {/* Dashboard del proyecto seleccionado */}
      {selectedProjectId && currentProject ? (
        <ProjectDashboard project={currentProject} />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          {loading ? (
            <LoadingApp />
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-300 mb-4">
                No hay proyectos registrados
              </p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={handleOpenNewProjectModal}
              >
                Crear primer proyecto
              </button>
            </div>
          ) : (
            <p className="text-center py-8 dark:text-gray-300">
              Seleccione un proyecto para ver sus detalles
            </p>
          )}
        </div>
      )}

      {/* Modal para crear nuevo proyecto */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={handleCloseNewProjectModal}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Projects;
