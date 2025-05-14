import { useEffect, useState } from "react";
import { useCommonAreasStore } from "../../../../../store/useCommonAreasStore";
import CommonAreaForm from "./CommonAreaForm";
import { formatCentsToMXN } from "../../../../../utils/curreyncy";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  WrenchIcon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  ClockIcon as ClockSolidIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";
import { createPortal } from "react-dom";

interface CommonAreaDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string;
}

const CommonAreaDetails = ({
  isOpen,
  onClose,
  areaId,
}: CommonAreaDetailsProps) => {
  const {
    getCommonArea,
    deleteCommonArea,
    setMaintenanceStatus,
    selectedArea,
    loading,
    error,
  } = useCommonAreasStore();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  useEffect(() => {
    if (isOpen && areaId) {
      getCommonArea(areaId);
    }
  }, [isOpen, areaId, getCommonArea]);

  const handleDelete = async () => {
    try {
      if (selectedArea?.id) {
        await deleteCommonArea(selectedArea.id);
        toast.success("Área común eliminada con éxito");
        onClose();
      }
    } catch (error) {
      console.error("Error al eliminar el área común:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al eliminar el área común"
      );
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    if (!selectedArea?.id) return;

    try {
      // Si está en mantenimiento, lo sacamos de mantenimiento
      if (selectedArea.status === "maintenance") {
        await setMaintenanceStatus(selectedArea.id, false);
        toast.success("Área común activada con éxito");
      } else {
        // Si no está en mantenimiento, lo ponemos en mantenimiento
        await setMaintenanceStatus(selectedArea.id, true, maintenanceNotes);
        toast.success("Área común puesta en mantenimiento");
      }
      setIsMaintenanceModalOpen(false);
      setMaintenanceNotes("");
    } catch (error) {
      console.error("Error al cambiar el estado de mantenimiento:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cambiar el estado de mantenimiento"
      );
    }
  };

  const navigateImages = (direction: "prev" | "next") => {
    if (!selectedArea?.images.length) return;

    if (direction === "prev") {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedArea.images.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === selectedArea.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleEditClose = () => {
    setIsEditFormOpen(false);
    // Actualizar la vista de detalles después de editar
    if (areaId) {
      getCommonArea(areaId);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <LoadingApp />
          </div>
        </div>
      </div>
    );
  }

  if (error || !selectedArea) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Error
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 dark:bg-red-900 dark:text-red-100">
            <span className="block sm:inline">
              {error || "No se pudo cargar el área común"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal principal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-y-auto z-40"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {selectedArea.name}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditFormOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Eliminar"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (selectedArea.status === "maintenance") {
                    // Si ya está en mantenimiento, no necesitamos mostrar el modal
                    setMaintenanceNotes("");
                    setIsMaintenanceModalOpen(true);
                  } else {
                    setIsMaintenanceModalOpen(true);
                  }
                }}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedArea.status === "maintenance"
                    ? "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    : "text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                }`}
                title={
                  selectedArea.status === "maintenance"
                    ? "Finalizar mantenimiento"
                    : "Marcar en mantenimiento"
                }
              >
                {selectedArea.status === "maintenance" ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <WrenchIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Galería de imágenes */}
            <div className="space-y-4">
              <div className="relative h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {selectedArea.images && selectedArea.images.length > 0 ? (
                  <>
                    <img
                      src={selectedArea.images[currentImageIndex]}
                      alt={selectedArea.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setShowFullscreenImage(true)}
                    />
                    {selectedArea.images.length > 1 && (
                      <>
                        <button
                          onClick={() => navigateImages("prev")}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                        >
                          <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => navigateImages("next")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                        >
                          <ChevronRightIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {selectedArea.name}
                    </span>
                  </div>
                )}
                {selectedArea.status === "maintenance" && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center">
                    <WrenchIcon className="h-4 w-4 mr-1" />
                    En Mantenimiento
                  </div>
                )}
                {selectedArea.status === "inactive" && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
                    Inactiva
                  </div>
                )}
              </div>

              {selectedArea.images && selectedArea.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {selectedArea.images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer ${
                        index === currentImageIndex
                          ? "ring-2 ring-indigo-500"
                          : ""
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${selectedArea.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información del área */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Descripción
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {selectedArea.description || "Sin descripción disponible."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>Capacidad: {selectedArea.capacity} personas</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <ClockIcon className="h-5 w-5 mr-2 text-indigo-500" />
                  <span>
                    Horario: {selectedArea.openTime} - {selectedArea.closeTime}
                  </span>
                </div>
              </div>

              {selectedArea.isReservable && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Reservable
                    </span>
                  </div>
                  <div className="text-indigo-700 dark:text-indigo-300">
                    Tarifa: {formatCentsToMXN(selectedArea.rate)}/hora
                  </div>
                </div>
              )}

              {selectedArea.amenities && selectedArea.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Amenidades
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArea.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 text-xs rounded-full py-1 px-3"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedArea.status === "maintenance" &&
                selectedArea.maintenanceNotes && (
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <WrenchIcon className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Notas de mantenimiento
                      </span>
                    </div>
                    <p className="text-amber-700 dark:text-amber-300">
                      {selectedArea.maintenanceNotes}
                    </p>
                  </div>
                )}

              {selectedArea.lastMaintenanceDate && (
                <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                  <ClockSolidIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    Último mantenimiento:{" "}
                    {new Date(
                      selectedArea.lastMaintenanceDate
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de eliminación */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ¿Estás seguro de que deseas eliminar el área común "
              {selectedArea.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de mantenimiento */}
      {isMaintenanceModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setIsMaintenanceModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedArea.status === "maintenance"
                  ? "Finalizar mantenimiento"
                  : "Poner en mantenimiento"}
              </h3>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {selectedArea.status !== "maintenance" && (
              <div className="mb-4">
                <label
                  htmlFor="maintenanceNotes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Notas de mantenimiento
                </label>
                <textarea
                  id="maintenanceNotes"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Describe el motivo del mantenimiento..."
                />
              </div>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {selectedArea.status === "maintenance"
                ? "¿Estás seguro de que deseas finalizar el mantenimiento de esta área común?"
                : "¿Estás seguro de que deseas poner esta área común en mantenimiento?"}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleMaintenanceToggle}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedArea.status === "maintenance"
                    ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                }`}
              >
                {selectedArea.status === "maintenance"
                  ? "Finalizar"
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de edición */}
      {isEditFormOpen && (
        <CommonAreaForm
          isOpen={isEditFormOpen}
          onClose={handleEditClose}
          areaToEdit={selectedArea}
        />
      )}

      {/* Imagen a pantalla completa como portal para asegurar que está en el nivel superior del DOM */}
      {showFullscreenImage &&
        selectedArea.images &&
        selectedArea.images.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center cursor-pointer"
            style={{ zIndex: 9999 }}
            onClick={() => setShowFullscreenImage(false)}
          >
            <div
              className="relative max-w-7xl max-h-screen p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedArea.images[currentImageIndex]}
                alt={selectedArea.name}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {selectedArea.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateImages("prev");
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                  >
                    <ChevronLeftIcon className="h-8 w-8" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateImages("next");
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullscreenImage(false);
                }}
                className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CommonAreaDetails;
