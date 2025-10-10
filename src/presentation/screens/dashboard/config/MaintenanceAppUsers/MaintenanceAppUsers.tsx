import { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { useCondominiumStore } from "../../../../../store/useCondominiumStore";
import { generatePassword } from "../../../../../utils/generatePassword";

interface MaintenanceUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  responsibleName: string;
  responsiblePhone: string;
  emergencyNumber: string;
  assignedCondominiums: string[]; // IDs de condominios
  photoURL?: string; // URL de la foto en Storage
  role: string;
  createdAt: Timestamp;
  uid: string; // UID de Firebase Auth
}

interface Credentials {
  email: string;
  password: string;
}

const MaintenanceAppUsers = () => {
  const db = getFirestore();
  const auth = getAuth();
  const { condominiums, fetchCondominiums } = useCondominiumStore();

  const [users, setUsers] = useState<MaintenanceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<MaintenanceUser | null>(
    null
  );
  const [editingUser, setEditingUser] = useState<MaintenanceUser | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    responsibleName: "",
    responsiblePhone: "",
    emergencyNumber: "",
    assignedCondominiums: [] as string[],
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const getClientId = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await getIdTokenResult(user);
        const id = token.claims.clientId as string;
        setClientId(id);
      }
    };
    getClientId();
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchCondominiums();
      fetchUsers();
    }
  }, [clientId]);

  const fetchUsers = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const usersRef = collection(
        db,
        `clients/${clientId}/maintenanceAppUsers`
      );
      const snapshot = await getDocs(usersRef);

      const usersData: MaintenanceUser[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MaintenanceUser[];

      setUsers(usersData);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCondominiumToggle = (condominiumId: string) => {
    setFormData((prev) => {
      const isSelected = prev.assignedCondominiums.includes(condominiumId);
      return {
        ...prev,
        assignedCondominiums: isSelected
          ? prev.assignedCondominiums.filter((id) => id !== condominiumId)
          : [...prev.assignedCondominiums, condominiumId],
      };
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar 5MB");
        return;
      }
      setPhotoFile(file);
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("El email no es válido");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("El teléfono es requerido");
      return false;
    }
    if (!formData.company.trim()) {
      toast.error("La empresa es requerida");
      return false;
    }
    if (!formData.responsibleName.trim()) {
      toast.error("El nombre del responsable es requerido");
      return false;
    }
    if (!formData.responsiblePhone.trim()) {
      toast.error("El teléfono del responsable es requerido");
      return false;
    }
    if (!formData.emergencyNumber.trim()) {
      toast.error("El número de emergencia es requerido");
      return false;
    }
    if (formData.assignedCondominiums.length === 0) {
      toast.error("Debe asignar al menos un condominio");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !clientId) return;

    try {
      setLoading(true);

      if (editingUser) {
        // Actualizar usuario existente

        // Si hay una nueva foto, enviar al backend para que la suba
        if (photoFile) {
          const formDataToSend = new FormData();
          formDataToSend.append("userId", editingUser.id);
          formDataToSend.append("clientId", clientId);
          formDataToSend.append("photo", photoFile);
          formDataToSend.append("name", formData.name);
          formDataToSend.append("phone", formData.phone);
          formDataToSend.append("company", formData.company);
          formDataToSend.append("responsibleName", formData.responsibleName);
          formDataToSend.append("responsiblePhone", formData.responsiblePhone);
          formDataToSend.append("emergencyNumber", formData.emergencyNumber);
          formDataToSend.append(
            "assignedCondominiums",
            JSON.stringify(formData.assignedCondominiums)
          );

          const response = await fetch(
            `${
              import.meta.env.VITE_URL_SERVER
            }/users-auth/update-maintenance-user`,
            {
              method: "PUT",
              body: formDataToSend,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al actualizar usuario");
          }
        } else {
          // Sin foto nueva, actualizar solo datos
          const userRef = doc(
            db,
            `clients/${clientId}/maintenanceAppUsers/${editingUser.id}`
          );

          await updateDoc(userRef, {
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            responsibleName: formData.responsibleName,
            responsiblePhone: formData.responsiblePhone,
            emergencyNumber: formData.emergencyNumber,
            assignedCondominiums: formData.assignedCondominiums,
          });
        }

        toast.success("Usuario actualizado exitosamente");
      } else {
        // Crear nuevo usuario
        const password = generatePassword();

        // Preparar FormData para enviar la foto
        const formDataToSend = new FormData();
        formDataToSend.append("email", formData.email);
        formDataToSend.append("password", password);
        formDataToSend.append("clientId", clientId);
        formDataToSend.append("name", formData.name);
        formDataToSend.append("phone", formData.phone);
        formDataToSend.append("company", formData.company);
        formDataToSend.append("responsibleName", formData.responsibleName);
        formDataToSend.append("responsiblePhone", formData.responsiblePhone);
        formDataToSend.append("emergencyNumber", formData.emergencyNumber);
        formDataToSend.append(
          "assignedCondominiums",
          JSON.stringify(formData.assignedCondominiums)
        );

        // Agregar foto si existe
        if (photoFile) {
          formDataToSend.append("photo", photoFile);
        }

        // Llamar al backend para crear el usuario
        const response = await fetch(
          `${
            import.meta.env.VITE_URL_SERVER
          }/users-auth/create-maintenance-user`,
          {
            method: "POST",
            body: formDataToSend, // Enviar FormData en lugar de JSON
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al crear usuario");
        }

        await response.json();

        // Mostrar credenciales
        setCredentials({
          email: formData.email,
          password: password,
        });
        setShowCredentials(true);

        toast.success("Usuario creado exitosamente");
      }

      // Resetear formulario
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        responsibleName: "",
        responsiblePhone: "",
        emergencyNumber: "",
        assignedCondominiums: [],
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error al guardar usuario:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("El email ya está en uso");
      } else if (error.code === "auth/invalid-email") {
        toast.error("El email no es válido");
      } else if (error.code === "auth/weak-password") {
        toast.error("La contraseña es muy débil");
      } else {
        toast.error("Error al guardar usuario: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: MaintenanceUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      responsibleName: user.responsibleName,
      responsiblePhone: user.responsiblePhone,
      emergencyNumber: user.emergencyNumber,
      assignedCondominiums: user.assignedCondominiums,
    });
    setPhotoPreview(user.photoURL || null);
    setPhotoFile(null);
    setShowForm(true);
  };

  const handleDeleteClick = (user: MaintenanceUser) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete || !clientId) return;

    try {
      setLoading(true);
      await deleteDoc(
        doc(db, `clients/${clientId}/maintenanceAppUsers/${userToDelete.id}`)
      );
      toast.success("Usuario eliminado exitosamente");
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      responsibleName: "",
      responsiblePhone: "",
      emergencyNumber: "",
      assignedCondominiums: [],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getCondominiumName = (id: string) => {
    const condo = condominiums.find((c) => c.id === id);
    return condo?.name || "Desconocido";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Usuarios de App de Mantenimiento
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestiona los usuarios que tendrán acceso a la aplicación de
            mantenimiento
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h4>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Responsable *
                </label>
                <input
                  type="text"
                  name="responsibleName"
                  value={formData.responsibleName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono del Responsable *
                </label>
                <input
                  type="tel"
                  name="responsiblePhone"
                  value={formData.responsiblePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Emergencia *
                </label>
                <input
                  type="tel"
                  name="emergencyNumber"
                  value={formData.emergencyNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            {/* Campo de Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Perfil
              </label>
              <div className="flex items-center space-x-4">
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                    <PhotoIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {photoFile ? photoFile.name : "Seleccionar foto"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Formatos: JPG, PNG, GIF. Máximo 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condominios Asignados *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                {condominiums.map((condo) => (
                  <label
                    key={condo.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedCondominiums.includes(condo.id)}
                      onChange={() => handleCondominiumToggle(condo.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {condo.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Guardando..."
                  : editingUser
                  ? "Actualizar"
                  : "Crear Usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading && !showForm ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Cargando usuarios...
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Condominios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                            src={user.photoURL}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.company}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.assignedCondominiums.map((condoId) => (
                          <span
                            key={condoId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                          >
                            {getCondominiumName(condoId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.createdAt?.toDate().toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Credenciales */}
      {showCredentials && credentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Credenciales del Usuario
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Guarda estas credenciales en un lugar seguro. No podrás
                verlas nuevamente.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.email}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.email)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentials.password}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.password)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setCredentials(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <strong>{userToDelete.name}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceAppUsers;
