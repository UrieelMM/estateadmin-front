import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  UserCircleIcon,
  DocumentIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import {
  usePersonalAdministrationStore,
  PersonalProfile,
} from "../../../../store/PersonalAdministration";
import { formatCurrency } from "../../../../utils/curreyncy";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  employee?: PersonalProfile | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  mode,
  employee,
}) => {
  const {
    addEmployee,
    updateEmployee,
    addDocument,
    deleteDocument,
    employees,
  } = usePersonalAdministrationStore();

  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      birthDate: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
    },
    employmentInfo: {
      employeeNumber: "",
      position: "vigilante" as
        | "vigilante"
        | "conserje"
        | "jardinero"
        | "limpieza"
        | "mantenimiento"
        | "administrador",
      area: "",
      startDate: "",
      contractType: "tiempo_completo" as
        | "tiempo_completo"
        | "medio_tiempo"
        | "temporal"
        | "por_horas",
      salary: 0,
      status: "activo" as "activo" | "inactivo" | "suspendido" | "vacaciones",
      pin: "",
    },
    photo: "",
  });

  const [activeTab, setActiveTab] = useState("personal");
  const [newDocument, setNewDocument] = useState({
    type: "INE" as const,
    name: "",
    url: "",
    expirationDate: "",
  });

  // Estados para manejo de archivos
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (employee && (mode === "edit" || mode === "view")) {
      setFormData({
        personalInfo: {
          ...employee.personalInfo,
          birthDate: employee.personalInfo.birthDate
            .toISOString()
            .split("T")[0],
          emergencyContact: { ...employee.personalInfo.emergencyContact },
        },
        employmentInfo: {
          ...employee.employmentInfo,
          startDate: employee.employmentInfo.startDate
            .toISOString()
            .split("T")[0],
        },
        photo: employee.photo || "",
      });
      setPhotoPreview(employee.photo || "");
    } else {
      // Reset form for create mode
      const today = new Date();
      const defaultBirthDate = new Date(
        today.getFullYear() - 25,
        today.getMonth(),
        today.getDate()
      );

      setFormData({
        personalInfo: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          birthDate: defaultBirthDate.toISOString().split("T")[0],
          emergencyContact: {
            name: "",
            phone: "",
            relationship: "",
          },
        },
        employmentInfo: {
          employeeNumber: "",
          position: "vigilante",
          area: "",
          startDate: today.toISOString().split("T")[0],
          contractType: "tiempo_completo",
          salary: 0,
          status: "activo",
          pin: "",
        },
        photo: "",
      });
      setPhotoPreview("");
      setPhotoFile(undefined);
    }
  }, [employee, mode]);

  // Manejar selección de foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no puede ser mayor a 5MB");
        return;
      }

      setPhotoFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar selección de documento
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("El archivo no puede ser mayor a 10MB");
        return;
      }

      setDocumentFile(file);
      setNewDocument((prev) => ({
        ...prev,
        name: prev.name || file.name,
        url: "", // Limpiar URL ya que usaremos archivo
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Validar que las fechas requeridas no estén vacías
      if (!formData.personalInfo.birthDate) {
        alert("La fecha de nacimiento es obligatoria");
        return;
      }

      if (!formData.employmentInfo.startDate) {
        alert("La fecha de ingreso es obligatoria");
        return;
      }

      const employeeData = {
        personalInfo: {
          ...formData.personalInfo,
          birthDate: new Date(formData.personalInfo.birthDate),
        },
        employmentInfo: {
          ...formData.employmentInfo,
          startDate: new Date(formData.employmentInfo.startDate),
        },
        photo: photoPreview || formData.photo || undefined,
        documents: employee?.documents || [],
      };

      if (mode === "create") {
        await addEmployee(employeeData, photoFile);
      } else if (mode === "edit" && employee) {
        await updateEmployee(employee.id, employeeData, photoFile);
      }

      onClose();
    } catch (error) {
      console.error("Error al guardar empleado:", error);
      alert("Error al guardar el empleado");
    } finally {
      setUploading(false);
    }
  };

  const handleAddDocument = async () => {
    if (employee && newDocument.name && (newDocument.url || documentFile)) {
      try {
        setUploading(true);
        const documentData = {
          ...newDocument,
          expirationDate: newDocument.expirationDate
            ? new Date(newDocument.expirationDate)
            : undefined,
        };

        await addDocument(employee.id, documentData, documentFile);

        setNewDocument({
          type: "INE",
          name: "",
          url: "",
          expirationDate: "",
        });
        setDocumentFile(undefined);

        // Reset file input
        const fileInput = document.getElementById(
          "document-file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } catch (error) {
        console.error("Error al agregar documento:", error);
        alert("Error al agregar el documento");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (
      employee &&
      window.confirm("¿Estás seguro de que deseas eliminar este documento?")
    ) {
      deleteDocument(employee.id, documentId);
    }
  };

  // Función para generar número de empleado automáticamente
  const generateEmployeeNumber = () => {
    const currentYear = new Date().getFullYear().toString().slice(-2); // Últimos 2 dígitos del año
    let employeeNumber = "";
    let counter = 1;

    // Buscar el siguiente número disponible
    do {
      const paddedCounter = counter.toString().padStart(3, "0"); // 3 dígitos con ceros a la izquierda
      employeeNumber = `EMP${currentYear}${paddedCounter}`; // Formato: EMP24001, EMP24002, etc.
      counter++;
    } while (
      employees.some(
        (emp) => emp.employmentInfo.employeeNumber === employeeNumber
      )
    );

    // Actualizar el formulario con el número generado
    setFormData((prev) => ({
      ...prev,
      employmentInfo: {
        ...prev.employmentInfo,
        employeeNumber: employeeNumber,
      },
    }));
  };

  const isReadOnly = mode === "view";

  const tabs = [
    { id: "personal", name: "Información Personal" },
    { id: "employment", name: "Información Laboral" },
    { id: "documents", name: "Documentos" },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === "create" && "Nuevo Empleado"}
                {mode === "edit" && "Editar Empleado"}
                {mode === "view" && "Información del Empleado"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }
                    `}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit}>
                {/* Personal Information Tab */}
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    {/* Photo Section */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Foto del empleado"
                              className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <UserCircleIcon className="h-20 w-20 text-gray-400" />
                          )}
                        </div>
                        {!isReadOnly && (
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Foto del Empleado
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="photo-upload"
                              />
                              <label
                                htmlFor="photo-upload"
                                className="flex-1 cursor-pointer inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                {photoFile
                                  ? photoFile.name
                                  : "Seleccionar foto"}
                              </label>
                              {photoPreview && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhotoFile(undefined);
                                    setPhotoPreview("");
                                    const input = document.getElementById(
                                      "photo-upload"
                                    ) as HTMLInputElement;
                                    if (input) input.value = "";
                                  }}
                                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Formatos: JPG, PNG, GIF. Máximo 5MB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isReadOnly}
                          value={formData.personalInfo.firstName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                firstName: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isReadOnly}
                          value={formData.personalInfo.lastName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                lastName: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          disabled={isReadOnly}
                          value={formData.personalInfo.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                email: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          required
                          disabled={isReadOnly}
                          value={formData.personalInfo.phone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                phone: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formData.personalInfo.address}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                address: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Nacimiento *
                        </label>
                        <input
                          type="date"
                          required
                          disabled={isReadOnly}
                          value={formData.personalInfo.birthDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              personalInfo: {
                                ...prev.personalInfo,
                                birthDate: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Contacto de Emergencia
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre
                          </label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={formData.personalInfo.emergencyContact.name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  emergencyContact: {
                                    ...prev.personalInfo.emergencyContact,
                                    name: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            disabled={isReadOnly}
                            value={formData.personalInfo.emergencyContact.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  emergencyContact: {
                                    ...prev.personalInfo.emergencyContact,
                                    phone: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Parentesco
                          </label>
                          <input
                            type="text"
                            disabled={isReadOnly}
                            value={
                              formData.personalInfo.emergencyContact
                                .relationship
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                personalInfo: {
                                  ...prev.personalInfo,
                                  emergencyContact: {
                                    ...prev.personalInfo.emergencyContact,
                                    relationship: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employment Information Tab */}
                {activeTab === "employment" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Número de Empleado *
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            required
                            disabled={isReadOnly}
                            value={formData.employmentInfo.employeeNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentInfo: {
                                  ...prev.employmentInfo,
                                  employeeNumber: e.target.value,
                                },
                              }))
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                            placeholder="Ej: EMP24001"
                          />
                          {mode === "create" && !isReadOnly && (
                            <button
                              type="button"
                              onClick={generateEmployeeNumber}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                              title="Generar número automáticamente"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                        {mode === "create" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Haz clic en "Auto" para generar automáticamente
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Posición *
                        </label>
                        <select
                          required
                          disabled={isReadOnly}
                          value={formData.employmentInfo.position}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                position: e.target.value as
                                  | "vigilante"
                                  | "conserje"
                                  | "jardinero"
                                  | "limpieza"
                                  | "mantenimiento"
                                  | "administrador",
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        >
                          <option value="vigilante">Vigilante</option>
                          <option value="conserje">Conserje</option>
                          <option value="jardinero">Jardinero</option>
                          <option value="limpieza">Limpieza</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="administrador">Administrador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Área *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isReadOnly}
                          value={formData.employmentInfo.area}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                area: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha de Ingreso *
                        </label>
                        <input
                          type="date"
                          required
                          disabled={isReadOnly}
                          value={formData.employmentInfo.startDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                startDate: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Contrato
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={formData.employmentInfo.contractType}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                contractType: e.target.value as
                                  | "tiempo_completo"
                                  | "medio_tiempo"
                                  | "temporal"
                                  | "por_horas",
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        >
                          <option value="tiempo_completo">
                            Tiempo Completo
                          </option>
                          <option value="medio_tiempo">Medio Tiempo</option>
                          <option value="temporal">Temporal</option>
                          <option value="por_horas">Por Horas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Salario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={isReadOnly}
                          value={formData.employmentInfo.salary}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                salary: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                        {formData.employmentInfo.salary > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatCurrency(formData.employmentInfo.salary)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={formData.employmentInfo.status}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                status: e.target.value as
                                  | "activo"
                                  | "inactivo"
                                  | "suspendido"
                                  | "vacaciones",
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        >
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="suspendido">Suspendido</option>
                          <option value="vacaciones">Vacaciones</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          PIN de Asistencia *
                        </label>
                        <input
                          type="password"
                          required
                          disabled={isReadOnly}
                          value={formData.employmentInfo.pin}
                          onChange={(e) => {
                            // Solo permitir números y máximo 4 dígitos
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                            setFormData((prev) => ({
                              ...prev,
                              employmentInfo: {
                                ...prev.employmentInfo,
                                pin: value,
                              },
                            }));
                          }}
                          placeholder="4 dígitos"
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PIN de 4 dígitos para registro de asistencia vía QR
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="space-y-6">
                    {/* Add New Document */}
                    {!isReadOnly && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Agregar Documento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Tipo
                            </label>
                            <select
                              value={newDocument.type}
                              onChange={(e) =>
                                setNewDocument((prev) => ({
                                  ...prev,
                                  type: e.target.value as any,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="INE">INE</option>
                              <option value="contrato">Contrato</option>
                              <option value="NSS">NSS</option>
                              <option value="RFC">RFC</option>
                              <option value="examen_medico">
                                Examen Médico
                              </option>
                              <option value="capacitacion">Capacitación</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Nombre del Documento
                            </label>
                            <input
                              type="text"
                              value={newDocument.name}
                              onChange={(e) =>
                                setNewDocument((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ej: INE Juan Pérez"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Fecha de Vencimiento (Opcional)
                            </label>
                            <input
                              type="date"
                              value={newDocument.expirationDate}
                              onChange={(e) =>
                                setNewDocument((prev) => ({
                                  ...prev,
                                  expirationDate: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Archivo
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                onChange={handleDocumentFileChange}
                                className="hidden"
                                id="document-file-input"
                              />
                              <label
                                htmlFor="document-file-input"
                                className="flex-1 cursor-pointer inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                              >
                                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                                {documentFile
                                  ? documentFile.name
                                  : "Seleccionar archivo"}
                              </label>
                              <button
                                type="button"
                                onClick={handleAddDocument}
                                disabled={
                                  !newDocument.name ||
                                  (!newDocument.url && !documentFile) ||
                                  uploading
                                }
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                              >
                                {uploading ? (
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                  <PlusIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Formatos: PDF, DOC, DOCX, JPG, PNG, GIF. Máximo
                              10MB.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Documents List */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Documentos
                      </h3>
                      {employee?.documents && employee.documents.length > 0 ? (
                        <div className="space-y-3">
                          {employee.documents.map((document) => (
                            <div
                              key={document.id}
                              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {document.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {document.type} • Subido:{" "}
                                    {document.uploadDate.toLocaleDateString()}
                                    {document.expirationDate && (
                                      <span className="ml-2">
                                        • Vence:{" "}
                                        {document.expirationDate.toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <a
                                  href={document.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                                >
                                  Ver
                                </a>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDocument(document.id)
                                    }
                                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                          No hay documentos registrados
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            {!isReadOnly && (
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : mode === "create" ? (
                    "Crear Empleado"
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default EmployeeModal;
