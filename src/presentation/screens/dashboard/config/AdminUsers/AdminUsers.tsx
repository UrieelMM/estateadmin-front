import { useState, useEffect } from "react";
import { useAdminUsersStore } from "../../../../../store/useAdminUsersStore";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOffice2Icon,
  PhotoIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

// Agregamos las interfaces necesarias
interface Condominium {
  id: string;
  name: string;
  clientId: string;
  [key: string]: any;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  condominiums: Condominium[];
}

const EditUserModal = ({
  isOpen,
  onClose,
  user,
  condominiums,
}: EditUserModalProps) => {
  const { updateUser, fetchUsers } = useAdminUsersStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    role: user?.role || ("admin" as "admin" | "admin-assistant"),
    condominiumUids: user?.condominiumUids || [],
    active: user?.active || true,
    photoURL: user?.photoURL || "",
  });
  const [processingChange, setProcessingChange] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || ("admin" as "admin" | "admin-assistant"),
        condominiumUids: user.condominiumUids || [],
        active: user.active || true,
        photoURL: user.photoURL || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setProcessingChange(true);
    const db = getFirestore();

    try {
      // Antes de procesar los nuevos condominios, primero actualizar los existentes si han cambiado
      const originalCondominiums = user.condominiumUids || [];
      const newCondominiums = formData.condominiumUids.filter(
        (condoId: string) => !originalCondominiums.includes(condoId)
      );
      const removedCondominiums = originalCondominiums.filter(
        (condoId: string) => !formData.condominiumUids.includes(condoId)
      );

      // Variables para llevar un conteo de las operaciones
      let createdUsers = 0;
      let existingUsers = 0;
      let updatedUsers = 0;
      let failedOperations = 0;

      // Primero, actualizar los condominiumUids en los usuarios existentes en los condominios originales
      // (que no han sido removidos)
      for (const condominiumId of originalCondominiums) {
        // Omitir los condominios que han sido eliminados de la selección
        if (removedCondominiums.includes(condominiumId)) {
          continue;
        }

        try {
          // Buscar el condominio en la lista para obtener su clientId
          const condominio = condominiums.find((c) => c.id === condominiumId);
          if (!condominio) {
            failedOperations++;
            continue;
          }

          const clientId = condominio.clientId;

          // La ruta para buscar al usuario en este condominio
          const usersRef = collection(
            db,
            `clients/${clientId}/condominiums/${condominiumId}/users`
          );
          const userDocRef = doc(usersRef, user.id);

          // Actualizar el array de condominiumUids en este documento
          await setDoc(
            userDocRef,
            {
              condominiumUids: formData.condominiumUids,
              updatedDate: new Date(),
            },
            { merge: true } // Usar merge para no sobrescribir otros campos
          );
          updatedUsers++;
        } catch (error) {
          failedOperations++;
        }
      }

      // Si hay nuevos condominios, debemos crear copias del usuario en cada uno
      if (newCondominiums.length > 0) {
        // Procesar cada nuevo condominio
        for (const condominiumId of newCondominiums) {
          try {
            // Buscar el condominio en la lista para obtener su clientId
            const condominio = condominiums.find((c) => c.id === condominiumId);
            if (!condominio) {
              failedOperations++;
              continue; // Pasar al siguiente condominio
            }

            const clientId = condominio.clientId;
            // La estructura correcta de Firestore es:
            // clients/clientId/condominiums/condominiumId/users
            const usersRef = collection(
              db,
              `clients/${clientId}/condominiums/${condominiumId}/users`
            );

            // Verificar si el usuario ya existe en el condominio basado en email
            const q = query(usersRef, where("email", "==", formData.email));

            const querySnapshot = await getDocs(q);

            // Si el usuario no existe (no hay documentos con ese email), crearlo
            if (querySnapshot.empty) {
              // Creamos un objeto con todos los campos que debe tener el usuario
              const userData = {
                name: formData.name,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                active: formData.active,
                photoURL: formData.photoURL,
                darkMode: user.darkMode || false,
                fcmToken: user.fcmToken || "",
                uid: user.uid, // Mantenemos el mismo uid para consistencia
                createdDate: new Date(),
                updatedDate: new Date(),
                condominiumUids: formData.condominiumUids, // Usar todos los condominios seleccionados
              };

              // Crear un nuevo documento para el usuario en el condominio
              // Usamos el mismo ID del usuario original para mantener consistencia
              const userDocRef = doc(usersRef, user.id);
              await setDoc(userDocRef, userData);
              createdUsers++;
            } else {
              existingUsers++;
            }
          } catch (error) {
            console.error("Error procesando condominio:", condominiumId, error);
            failedOperations++;
          }
        }
      }

      // Actualizar el usuario en la base de datos principal
      await updateUser(user.id, formData);
      await fetchUsers(user.condominiumUids[0]);

      // Mostrar un solo mensaje resumiendo todas las operaciones
      if (newCondominiums.length > 0 || updatedUsers > 0) {
        // Mensaje principal
        let results = [];

        if (createdUsers > 0) {
          results.push(
            `Creado en ${createdUsers} ${
              createdUsers === 1 ? "nuevo condominio" : "nuevos condominios"
            }`
          );
        }

        if (updatedUsers > 0) {
          results.push(
            `Actualizado en ${updatedUsers} ${
              updatedUsers === 1
                ? "condominio existente"
                : "condominios existentes"
            }`
          );
        }

        if (existingUsers > 0) {
          results.push(
            `${existingUsers} ${
              existingUsers === 1
                ? "condominio ya tenía"
                : "condominios ya tenían"
            } este usuario`
          );
        }

        if (failedOperations > 0) {
          results.push(
            `${failedOperations} ${
              failedOperations === 1
                ? "operación falló"
                : "operaciones fallaron"
            }`
          );
        }

        let message = "Usuario actualizado";
        if (results.length > 0) {
          message += `: ${results.join(", ")}.`;
        } else {
          message += ".";
        }

        toast.success(message);
      } else {
        toast.success("Usuario actualizado correctamente");
      }

      onClose();
    } catch (error) {
      toast.error("Error al actualizar el usuario");
    } finally {
      setProcessingChange(false);
    }
  };

  const handleCondominiumToggle = (condominiumId: string) => {
    setFormData((prev) => ({
      ...prev,
      condominiumUids: prev.condominiumUids.includes(condominiumId)
        ? prev.condominiumUids.filter((id: string) => id !== condominiumId)
        : [...prev.condominiumUids, condominiumId],
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  Editar Usuario
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as "admin" | "admin-assistant",
                        })
                      }
                      className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                    >
                      <option value="admin">Administrador</option>
                      <option value="admin-assistant">Asistente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estado
                    </label>
                    <select
                      value={formData.active.toString()}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          active: e.target.value === "true",
                        })
                      }
                      className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condominios Asignados
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded">
                      {condominiums.map((condo) => (
                        <label
                          key={condo.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.condominiumUids.includes(
                              condo.id
                            )}
                            onChange={() => handleCondominiumToggle(condo.id)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {condo.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formData.condominiumUids.length >
                      user.condominiumUids?.length && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Al agregar nuevos condominios, se copiará el usuario en
                        cada uno de los condiminios seleccionados.
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      disabled={processingChange}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={processingChange}
                    >
                      {processingChange ? "Procesando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
}

const PasswordModal = ({ isOpen, onClose, password }: PasswordModalProps) => {
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    toast.success("Contraseña copiada al portapapeles");
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  Credenciales del Nuevo Usuario
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                    Se ha generado una contraseña temporal para el nuevo
                    usuario. Por favor, comparta estas credenciales de forma
                    segura.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <code className="text-indigo-600 dark:text-indigo-400">
                        {password}
                      </code>
                    </div>
                    <button
                      onClick={handleCopyPassword}
                      className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Copiar contraseña"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Entendido
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const AdminUsers = () => {
  const {
    users,
    condominiums,
    loading,
    fetchUsers,
    fetchCondominiums,
    createUser,
    toggleUserActive,
  } = useAdminUsersStore();

  const [selectedCondominium, setSelectedCondominium] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    role: "admin" as "admin" | "admin-assistant",
    photoURL: "",
    condominiumUids: [] as string[],
    uid: "",
    active: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const loadCondominiums = async () => {
      await fetchCondominiums();

      // Asegurarnos de que los condominios tengan la propiedad clientId
      // Esto es crítico para poder crear usuarios en los condominios correctamente
      if (condominiums.length > 0 && !condominiums[0].clientId) {
        toast.error("Error: Información de condominios incompleta");
      }
    };

    loadCondominiums();
  }, [fetchCondominiums]);

  useEffect(() => {
    if (selectedCondominium) {
      fetchUsers(selectedCondominium);
    }
  }, [selectedCondominium, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCondominium) return;

    const userData = {
      ...formData,
      condominiumUids: [selectedCondominium],
      uid: Date.now().toString(),
    };

    const result = await createUser(userData);
    if (result.success && result.password) {
      setGeneratedPassword(result.password);
      setShowPasswordModal(true);
      await fetchUsers(selectedCondominium);
    }
    setShowCreateForm(false);
    setFormData({
      name: "",
      lastName: "",
      email: "",
      role: "admin" as "admin" | "admin-assistant",
      photoURL: "",
      condominiumUids: [],
      uid: "",
      active: true,
    });
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    await toggleUserActive(userId, active);
    if (selectedCondominium) {
      await fetchUsers(selectedCondominium);
    }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Usuarios Administrativos
        </h2>
        {selectedCondominium && users.length < 2 && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Seleccionar Condominio
        </label>
        <select
          value={selectedCondominium}
          onChange={(e) => setSelectedCondominium(e.target.value)}
          className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
        >
          <option value="">Seleccione un condominio</option>
          {condominiums.map((condo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name}
            </option>
          ))}
        </select>
      </div>

      {showCreateForm && selectedCondominium && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="px-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="px-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "admin-assistant",
                    })
                  }
                  className="px-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                >
                  <option value="admin">Administrador</option>
                  <option value="admin-assistant">Asistente</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Foto de Perfil (URL)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhotoIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={formData.photoURL}
                  onChange={(e) =>
                    setFormData({ ...formData, photoURL: e.target.value })
                  }
                  className="px-10 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      )}

      {loading && <div className="text-center">Cargando...</div>}

      {selectedCondominium && users.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.photoURL}
                          alt={user.name}
                        />
                      ) : (
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      {user.role === "admin" ? "Administrador" : "Asistente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user.id!, !user.active)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                      }`}
                    >
                      {user.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="bg-indigo-600 px-3 py-2 rounded-md text-white hover:bg-indigo-700 ml-2"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          condominiums={condominiums}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          password={generatedPassword}
        />
      )}
    </div>
  );
};

export default AdminUsers;
