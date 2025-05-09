import { useState, useEffect } from "react";
import { useCommonAreasStore } from "../../../../store/useCommonAreasStore";

import { PlusIcon } from "@heroicons/react/24/solid";
import LoadingApp from "../../../components/shared/loaders/LoadingApp";
import CommonAreaDetails from "./components/CommonAreaDetails";
import CommonAreaForm from "./components/CommonAreaForm";
import CommonAreasList from "./components/CommonAreasList";

const CommonAreas = () => {
  const { fetchCommonAreas, commonAreas, loading, error } =
    useCommonAreasStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  useEffect(() => {
    fetchCommonAreas();
  }, [fetchCommonAreas]);

  const handleViewDetails = (id: string) => {
    setSelectedAreaId(id);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedAreaId(null);
  };

  return (
    <>
      <div className="px-4 shadow-lg rounded-md sm:px-6 lg:px-8">
        <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
          <p className="text-md">Áreas Comunes</p>
          <button
            className="btn-primary h-10 mb-3 flex items-center gap-2"
            onClick={() => setIsFormOpen(true)}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Área</span>
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingApp />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 dark:bg-red-900 dark:text-red-100">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="mt-8 pb-8">
            <CommonAreasList
              commonAreas={commonAreas}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}
      </div>

      {/* Formulario modal para crear/editar áreas comunes */}
      <CommonAreaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {/* Modal de detalles del área común */}
      {selectedAreaId && (
        <CommonAreaDetails
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          areaId={selectedAreaId}
        />
      )}
    </>
  );
};

export default CommonAreas;
