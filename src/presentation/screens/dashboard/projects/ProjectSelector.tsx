import React from "react";
import { Project } from "../../../../store/projectStore";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  loading: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  loading,
}) => {
  if (loading) {
    return (
      <div className="w-full sm:w-64 pr-2 pl-2 py-2 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="animate-pulse h-5 bg-gray-200 rounded mb-2"></div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Cargando proyectos...
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="w-full sm:w-64 pr-2 pl-2 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
        Sin proyectos disponibles
      </div>
    );
  }

  return (
    <select
      aria-label="Seleccionar proyecto"
      className="w-full sm:w-64 pr-2 pl-2 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-700 dark:ring-indigo-600 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
      value={selectedProjectId || ""}
      onChange={(e) => onProjectChange(e.target.value)}
    >
      <option value="" disabled>
        Selecciona un proyecto
      </option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
};

export default ProjectSelector;
