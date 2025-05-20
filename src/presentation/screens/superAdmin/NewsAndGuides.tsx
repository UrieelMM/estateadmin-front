import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import "moment/locale/es";
import useNewsAndGuidesStore from "../../../store/superAdmin/useNewsAndGuidesStore";
import { Switch } from "@headlessui/react";

interface NewsGuideItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  url: string;
  active: boolean;
  createdAt: string;
}

const NewsAndGuides: React.FC = () => {
  const {
    newsAndGuides,
    loading,
    fetchNewsAndGuides,
    createNewsGuide,
    updateNewsGuide,
    deleteNewsGuide,
  } = useNewsAndGuidesStore();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [url, setUrl] = useState("/guias");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsAndGuides();
  }, [fetchNewsAndGuides]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    if (!imageFile && !isEditing) {
      toast.error("La imagen es obligatoria");
      return;
    }

    try {
      if (isEditing && currentItemId) {
        await updateNewsGuide(currentItemId, {
          title,
          subtitle,
          url,
          active,
          imageFile,
        });
        toast.success("Noticia/guía actualizada correctamente");
      } else {
        if (!imageFile) {
          toast.error("La imagen es obligatoria");
          return;
        }

        await createNewsGuide({
          title,
          subtitle,
          url,
          active,
          imageFile,
        });
        toast.success("Noticia/guía creada correctamente");
      }

      resetForm();
    } catch (err) {
      toast.error("Error al guardar la noticia/guía");
    }
  };

  const handleEdit = (item: NewsGuideItem) => {
    setTitle(item.title);
    setSubtitle(item.subtitle);
    setUrl(item.url || "/guias");
    setActive(item.active === undefined ? true : item.active);
    setImagePreview(item.imageUrl);
    setIsEditing(true);
    setCurrentItemId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta noticia/guía?")) {
      try {
        await deleteNewsGuide(id);
        toast.success("Noticia/guía eliminada correctamente");
      } catch (err) {
        toast.error("Error al eliminar la noticia/guía");
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setUrl("/dashboard");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setIsEditing(false);
    setCurrentItemId(null);
  };

  if (loading && !newsAndGuides.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Administración de Novedades y Guías
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? "Editar Noticia/Guía" : "Nueva Noticia/Guía"}
            </h3>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Título *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Subtítulo
                </label>
                <textarea
                  id="subtitle"
                  rows={3}
                  value={subtitle}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setSubtitle(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  URL de redirección
                </label>
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrl(e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="/guias"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ruta a la que será redirigido el usuario (ej: /guias/calendar)
                </p>
              </div>

              <div className="mb-4">
                <div className="flex items-center">
                  <Switch
                    checked={active}
                    onChange={setActive}
                    className={`${
                      active ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        active ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Las guías inactivas no se mostrarán a los usuarios
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Imagen {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={!isEditing}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Formatos recomendados: JPG, PNG. Tamaño máximo: 5MB
                </p>
              </div>

              {imagePreview && (
                <div className="mb-4">
                  <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vista previa:
                  </p>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="max-h-48 rounded-md border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? "Actualizar" : "Guardar"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Tabla de noticias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Novedades y Guías Existentes
            </h3>
          </div>

          <div className="p-4">
            {newsAndGuides.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No hay novedades o guías registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Imagen
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Título
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-600">
                    {newsAndGuides.map((item: NewsGuideItem) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {item.subtitle}
                            </div>
                          )}
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {item.url || "/guias"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {item.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {moment(item.createdAt)
                            .locale("es")
                            .format("DD MMM, YYYY")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {loading && newsAndGuides.length > 0 && (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsAndGuides;
