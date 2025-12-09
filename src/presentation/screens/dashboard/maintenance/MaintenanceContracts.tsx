import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  MaintenanceContract,
  useMaintenanceContractStore,
} from "../../../../store/useMaintenanceStore";
import {
  formatCentsToMXN,
  formatMXNToCents,
} from "../../../../utils/curreyncy";
import toast from "react-hot-toast";
import { useFileCompression } from "../../../../hooks/useFileCompression";

// Componente para mostrar alertas de contratos próximos a vencer
const ExpiringContractsAlert = ({
  contracts,
}: {
  contracts: MaintenanceContract[];
}) => {
  if (contracts.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 dark:bg-amber-900/30 dark:border-amber-500">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-amber-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Contratos próximos a vencer
          </h3>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
            <ul className="list-disc pl-5 space-y-1">
              {contracts.map((contract) => (
                <li key={contract.id}>
                  {contract.providerName} - {contract.serviceType}: vence el{" "}
                  {new Date(contract.endDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente del modal de confirmación para eliminar
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contractName: string;
}

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  contractName,
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationCircleIcon
              className="h-6 w-6 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Eliminar contrato
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ¿Estás seguro de eliminar el contrato con{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {contractName}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para la gestión de contratos de mantenimiento
const MaintenanceContracts = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [contractToEdit, setContractToEdit] =
    useState<MaintenanceContract | null>(null);
  const [isViewingContract, setIsViewingContract] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<MaintenanceContract | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [contractToDeleteName, setContractToDeleteName] = useState<string>("");

  const {
    contracts,
    loading,
    error,
    fetchContracts,
    deleteContract,
    getExpiringContracts,
  } = useMaintenanceContractStore();

  const expiringContracts = getExpiringContracts();

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleOpenForm = (contract?: MaintenanceContract) => {
    if (contract) {
      setContractToEdit(contract);
    } else {
      setContractToEdit(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setContractToEdit(null);
  };

  const handleViewContract = (contract: MaintenanceContract) => {
    setSelectedContract(contract);
    setIsViewingContract(true);
  };

  const handleOpenDeleteModal = (contractId: string, providerName: string) => {
    setContractToDelete(contractId);
    setContractToDeleteName(providerName);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setContractToDelete(null);
    setContractToDeleteName("");
  };

  const handleDeleteContract = async () => {
    if (contractToDelete) {
      await deleteContract(contractToDelete);
      handleCloseDeleteModal();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Contratos de Mantenimiento
        </h2>
        <button
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium"
          onClick={() => handleOpenForm()}
        >
          <PlusIcon className="h-5 w-5 mr-1.5" />
          Nuevo Contrato
        </button>
      </div>

      {/* Mostrar alertas de contratos próximos a vencer */}
      {expiringContracts.length > 0 && (
        <ExpiringContractsAlert contracts={expiringContracts} />
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 dark:bg-red-900/30 dark:border-red-500">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
            No hay contratos
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza registrando un nuevo contrato de mantenimiento.
          </p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Contrato
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {contract.providerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {contract.serviceType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {new Date(contract.startDate).toLocaleDateString()} -{" "}
                    {new Date(contract.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                          : contract.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                      }`}
                    >
                      {contract.status === "active"
                        ? "Activo"
                        : contract.status === "pending"
                        ? "Pendiente"
                        : "Vencido"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {formatCentsToMXN(contract.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewContract(contract)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Ver detalles"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                      {contract.contractFileUrl && (
                        <a
                          href={contract.contractFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Descargar contrato"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenForm(contract)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleOpenDeleteModal(
                            contract.id!,
                            contract.providerName
                          )
                        }
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
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

      {isFormOpen && (
        <ContractForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          contract={contractToEdit}
        />
      )}

      {isViewingContract && selectedContract && (
        <ContractViewer
          isOpen={isViewingContract}
          onClose={() => setIsViewingContract(false)}
          contract={selectedContract}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteContract}
        contractName={contractToDeleteName}
      />
    </div>
  );
};

// Componente de formulario para crear/editar contratos
interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  contract?: MaintenanceContract | null;
}

const ContractForm = ({ isOpen, onClose, contract }: ContractFormProps) => {
  const { createContract, updateContract, loading } =
    useMaintenanceContractStore();
  const { compressFile, isCompressing } = useFileCompression();
  const [formData, setFormData] = useState<Partial<MaintenanceContract>>({
    providerName: contract?.providerName || "",
    serviceType: contract?.serviceType || "",
    description: contract?.description || "",
    startDate: contract?.startDate || new Date().toISOString().split("T")[0],
    endDate:
      contract?.endDate ||
      new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
    value: contract?.value || 0,
    status: contract?.status || "pending",
    contactName: contract?.contactName || "",
    contactPhone: contract?.contactPhone || "",
    contactEmail: contract?.contactEmail || "",
    notes: contract?.notes || "",
    contractFileUrl: contract?.contractFileUrl || "",
  });

  const [contractFile, setContractFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(
    contract?.contractFileUrl || null
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Si es el campo de valor, convertir a centavos
    if (name === "value") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatMXNToCents(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      try {
        const processed = await compressFile(file);
        setContractFile(processed);
        
        // Crear una vista previa del archivo si existe
        // Solo para PDFs y archivos de imagen
        if (processed.type.includes("pdf") || processed.type.includes("image")) {
          const reader = new FileReader();
          reader.onload = () => {
             setFilePreview(reader.result as string);
          };
          reader.readAsDataURL(processed);
        } else {
          setFilePreview(null);
        }
        
        toast.success("Archivo procesado");
      } catch (error) {
        console.error(error);
        setContractFile(file);
        // Fallback preview logic for original file if compression fails
        if (file.type.includes("pdf") || file.type.includes("image")) {
          const reader = new FileReader();
          reader.onload = () => {
             setFilePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    } else {
        setContractFile(null);
        setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (contract?.id) {
        await updateContract(contract.id, formData, contractFile || undefined);
      } else {
        await createContract(
          formData as MaintenanceContract,
          contractFile || undefined
        );
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar el contrato:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {contract ? "Editar contrato" : "Nuevo contrato"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del proveedor
              </label>
              <input
                type="text"
                name="providerName"
                value={formData.providerName}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de servicio
              </label>
              <input
                type="text"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de inicio
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate?.toString().split("T")[0]}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de finalización
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate?.toString().split("T")[0]}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor del contrato ($)
              </label>
              <input
                type="text"
                name="value"
                value={
                  formData.value
                    ? formatCentsToMXN(formData.value).replace(/[^\d.,]/g, "")
                    : ""
                }
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="pending">Pendiente</option>
                <option value="active">Activo</option>
                <option value="expired">Vencido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de contacto
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono de contacto
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email de contacto
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Documento del contrato (PDF)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                  {filePreview || formData.contractFileUrl ? (
                    <div className="flex flex-col items-center">
                      <DocumentTextIcon className="h-12 w-12 text-indigo-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {contractFile ? contractFile.name : "Contrato cargado"}
                      </p>
                      {formData.contractFileUrl && !contractFile && (
                        <a
                          href={formData.contractFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 text-sm mt-2"
                        >
                          Ver contrato actual
                        </a>
                      )}
                      <button
                        type="button"
                        className="text-sm text-red-600 mt-2"
                        onClick={() => {
                          setContractFile(null);
                          setFilePreview(null);
                          if (!contract?.contractFileUrl) {
                            setFormData((prev) => ({
                              ...prev,
                              contractFileUrl: "",
                            }));
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="contract-file-upload"
                          className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Subir un archivo</span>
                          <input
                            id="contract-file-upload"
                            name="contract-file-upload"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">o arrastrar y soltar</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, Word o imágenes hasta 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas adicionales
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isCompressing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading || isCompressing ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente para visualizar los detalles de un contrato
interface ContractViewerProps {
  isOpen: boolean;
  onClose: () => void;
  contract: MaintenanceContract;
}

const ContractViewer = ({ isOpen, onClose, contract }: ContractViewerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Detalles del contrato
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Proveedor
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.providerName}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Servicio
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.serviceType}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descripción
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.description}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Período
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(contract.startDate).toLocaleDateString()} -{" "}
                  {new Date(contract.endDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estado
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    contract.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                      : contract.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                  }`}
                >
                  {contract.status === "active"
                    ? "Activo"
                    : contract.status === "pending"
                    ? "Pendiente"
                    : "Vencido"}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Valor
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatCentsToMXN(contract.value)}
                </p>
              </div>

              {contract.contractFileUrl && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Documento del contrato
                  </p>
                  <div className="mt-2">
                    <a
                      href={contract.contractFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                    >
                      <DocumentArrowDownIcon className="mr-1.5 h-5 w-5" />
                      Ver/Descargar contrato
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h4 className="font-medium text-gray-900 dark:text-white text-base mt-4">
            Información de contacto
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nombre
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.contactName || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Teléfono
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.contactPhone || "-"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {contract.contactEmail || "-"}
                </p>
              </div>
            </div>
          </div>

          {contract.notes && (
            <>
              <h4 className="font-medium text-gray-900 dark:text-white text-base mt-4">
                Notas adicionales
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white">
                  {contract.notes}
                </p>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceContracts;
