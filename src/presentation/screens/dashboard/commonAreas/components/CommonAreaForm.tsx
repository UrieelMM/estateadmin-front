import { useState, FormEvent, useRef, useEffect } from "react";
import {
  useCommonAreasStore,
  CommonArea,
} from "../../../../../store/useCommonAreasStore";
import toast from "react-hot-toast";
import {
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import {
  formatCentsToMXN,
  formatMXNToCents,
} from "../../../../../utils/curreyncy";

interface CommonAreaFormProps {
  isOpen: boolean;
  onClose: () => void;
  areaToEdit?: CommonArea | null;
}

const CommonAreaForm = ({
  isOpen,
  onClose,
  areaToEdit = null,
}: CommonAreaFormProps) => {
  const { createCommonArea, updateCommonArea, loading } = useCommonAreasStore();

  // Estado para los campos del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState<number>(0);
  const [rate, setRate] = useState<string>("0.00");
  const [isReservable, setIsReservable] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [status, setStatus] = useState<"active" | "maintenance" | "inactive">(
    "active"
  );
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si hay un área para editar, llenar el formulario con sus datos
  useEffect(() => {
    if (areaToEdit) {
      setName(areaToEdit.name || "");
      setDescription(areaToEdit.description || "");
      setCapacity(areaToEdit.capacity || 0);
      setRate(formatCentsToMXN(areaToEdit.rate || 0).replace("$", ""));
      setIsReservable(areaToEdit.isReservable || false);
      setOpenTime(areaToEdit.openTime || "08:00");
      setCloseTime(areaToEdit.closeTime || "22:00");
      setStatus(areaToEdit.status || "active");
      setAmenities(areaToEdit.amenities || []);
      setImagePreviews(areaToEdit.images || []);
    } else {
      // Reset form if not editing
      resetForm();
    }
  }, [areaToEdit, isOpen]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCapacity(0);
    setRate("0.00");
    setIsReservable(true);
    setOpenTime("08:00");
    setCloseTime("22:00");
    setStatus("active");
    setAmenities([]);
    setNewAmenity("");
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (index: number) => {
    const newAmenities = [...amenities];
    newAmenities.splice(index, 1);
    setAmenities(newAmenities);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Crear previews para las imágenes seleccionadas
      const newImagePreviews = filesArray.map((file) =>
        URL.createObjectURL(file)
      );

      setImageFiles((prevFiles) => [...prevFiles, ...filesArray]);
      setImagePreviews((prevPreviews) => [
        ...prevPreviews,
        ...newImagePreviews,
      ]);
    }
  };

  const handleRemoveImage = (index: number) => {
    // Liberar el objeto URL para evitar fugas de memoria
    if (index < imagePreviews.length) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    // Si estamos eliminando una imagen recién seleccionada (no una imagen existente del área)
    if (index < imageFiles.length) {
      const newFiles = [...imageFiles];
      newFiles.splice(index, 1);
      setImageFiles(newFiles);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre del área es obligatorio");
      return;
    }

    if (capacity <= 0) {
      toast.error("La capacidad debe ser mayor a 0");
      return;
    }

    const rateInCents = formatMXNToCents(rate);

    try {
      const commonAreaData: CommonArea = {
        name: name.trim(),
        description: description.trim(),
        capacity,
        rate: rateInCents,
        isReservable,
        openTime,
        closeTime,
        status,
        amenities,
        images: [], // Se llenarán durante el proceso de creación/actualización
      };

      if (areaToEdit && areaToEdit.id) {
        // Actualizar área existente
        await updateCommonArea(areaToEdit.id, commonAreaData, imageFiles);
        toast.success("Área común actualizada con éxito");
      } else {
        // Crear nueva área
        await createCommonArea(commonAreaData, imageFiles);
        toast.success("Área común creada con éxito");
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Error al guardar el área común:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el área común"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center overflow-y-auto z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {areaToEdit ? "Editar Área Común" : "Nueva Área Común"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "active" | "maintenance" | "inactive"
                      )
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Activa</option>
                    <option value="maintenance">En Mantenimiento</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="isReservable"
                    checked={isReservable}
                    onChange={(e) => setIsReservable(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isReservable"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Disponible para reservaciones
                  </label>
                </div>

                {isReservable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tarifa por hora
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">
                          $
                        </span>
                      </div>
                      <input
                        type="text"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 pl-8 pr-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora de apertura
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora de cierre
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Sección de amenidades e imágenes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amenidades
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Agregar amenidad..."
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 text-xs rounded-full py-1 px-3 flex items-center"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(index)}
                        className="ml-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imágenes
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-300">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Subir imágenes</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={handleImageChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF hasta 10MB
                    </p>
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Vista previa ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : areaToEdit ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommonAreaForm;
