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
  const [condominiumId, setCondominiumId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Obtener los proyectos al montar el componente
  useEffect(() => {
    const storedCondominiumId = localStorage.getItem("condominiumId");
    setCondominiumId(storedCondominiumId);
    if (storedCondominiumId) {
      fetchProjects(storedCondominiumId);
    }
  }, [fetchProjects]);

  // Seleccionar el primer proyecto por defecto cuando se cargan
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      fetchProjectById(projects[0].id);
    }
  }, [projects, selectedProjectId, fetchProjectById]);

  // Si el proyecto seleccionado ya no existe, seleccionar uno válido
  useEffect(() => {
    if (!selectedProjectId || projects.length === 0) {
      return;
    }

    const selectedExists = projects.some(
      (project) => project.id === selectedProjectId
    );
    if (!selectedExists) {
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

  const handleReloadProjects = async () => {
    if (!condominiumId) {
      toast.error("Selecciona un condominio para cargar proyectos.");
      return;
    }
    await fetchProjects(condominiumId);
  };

  const renderEmptyState = () => {
    if (loading) {
      return <LoadingApp />;
    }

    if (!condominiumId) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            No hay un condominio seleccionado.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona un condominio para gestionar sus proyectos.
          </p>
        </div>
      );
    }

    if (error && projects.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-3">
            No se pudieron cargar los proyectos.
          </p>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
            onClick={handleReloadProjects}
          >
            Reintentar carga
          </button>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-300 mb-2">
            Aún no hay proyectos registrados.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Crea el primer proyecto para iniciar el control de avance, gastos y
            tareas.
          </p>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
            onClick={handleOpenNewProjectModal}
          >
            Crear primer proyecto
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-gray-700 dark:text-gray-300">
          Selecciona un proyecto para ver su dashboard detallado.
        </p>
      </div>
    );
  };

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
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800 dark:shadow-lg">
          {renderEmptyState()}
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
