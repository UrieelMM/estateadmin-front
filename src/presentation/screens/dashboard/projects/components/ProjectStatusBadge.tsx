import React from 'react';
import { ProjectStatus } from '../../../../../store/projectStore';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({ status }) => {
  // Definir clases de estilo según el estado
  const getStatusClasses = (): string => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case ProjectStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener el texto del estado en español
  const getStatusLabel = (): string => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'En Progreso';
      case ProjectStatus.COMPLETED:
        return 'Finalizado';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {getStatusLabel()}
    </span>
  );
};

export default ProjectStatusBadge;
