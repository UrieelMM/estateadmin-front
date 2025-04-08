import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

interface NewProjectButtonProps {
  onClick: () => void;
}

const NewProjectButton: React.FC<NewProjectButtonProps> = ({ onClick }) => {
  return (
    <button
      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={onClick}
    >
      <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
      Nuevo Proyecto
    </button>
  );
};

export default NewProjectButton;
