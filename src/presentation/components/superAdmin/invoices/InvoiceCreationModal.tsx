import React, { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import useSuperAdminStore from "../../../../store/superAdmin/SuperAdminStore";
import useBillingStore, {
  InvoiceData,
} from "../../../../store/superAdmin/BillingStore";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

interface InvoiceCreationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Condominium {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
}

const InvoiceCreationModal: React.FC<InvoiceCreationModalProps> = ({
  open,
  setOpen,
  onSuccess,
}) => {
  const [clientId, setClientId] = useState<string>("");
  const [condominiumId, setCondominiumId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [optionalMessage, setOptionalMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlFileName, setXmlFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const { clients, fetchClients } = useSuperAdminStore();
  const { createInvoice, fetchInvoices, resetInvoicesState } =
    useBillingStore();
  const db = getFirestore();

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open, fetchClients]);

  useEffect(() => {
    const fetchCondominiums = async () => {
      if (!clientId) {
        setCondominiums([]);
        return;
      }

      try {
        const condominiumsRef = collection(
          db,
          `clients/${clientId}/condominiums`
        );
        const condominiumsSnapshot = await getDocs(condominiumsRef);

        const condominiumsList = condominiumsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
        }));

        setCondominiums(condominiumsList);
        setCondominiumId("");
      } catch (error) {
        console.error("Error al obtener condominios:", error);
        toast.error("Error al cargar los condominios");
      }
    };

    fetchCondominiums();
  }, [clientId, db]);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      if (!clientId || !condominiumId) {
        setAdminUsers([]);
        return;
      }

      try {
        const usersRef = collection(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/users`
        );
        const adminQuery = query(usersRef, where("role", "==", "admin"));
        const adminsSnapshot = await getDocs(adminQuery);

        const adminsList = adminsSnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || "",
          displayName: doc.data().displayName || doc.data().email || "",
        }));

        setAdminUsers(adminsList);
        setUserId("");
      } catch (error) {
        console.error("Error al obtener usuarios administradores:", error);
        toast.error("Error al cargar los usuarios administradores");
      }
    };

    fetchAdminUsers();
  }, [clientId, condominiumId, db]);

  const handleResetForm = () => {
    setClientId("");
    setCondominiumId("");
    setUserId("");
    setAmount("");
    setDueDate("");
    setOptionalMessage("");
    setFile(null);
    setFileName("");
    setXmlFile(null);
    setXmlFileName("");
  };

  const dropzoneOptions = {
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setFileName(acceptedFiles[0].name);
      }
    },
  };

  const xmlDropzoneOptions = {
    accept: {
      "application/xml": [".xml"],
      "text/xml": [".xml"],
    },
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setXmlFile(acceptedFiles[0]);
        setXmlFileName(acceptedFiles[0].name);
      }
    },
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  const {
    getRootProps: getXmlRootProps,
    getInputProps: getXmlInputProps,
    isDragActive: isXmlDragActive,
  } = useDropzone(xmlDropzoneOptions);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones
    if (
      !clientId ||
      !condominiumId ||
      !userId ||
      !amount ||
      !dueDate ||
      !file
    ) {
      toast.error(
        "Todos los campos son obligatorios excepto el XML y el mensaje opcional"
      );
      setLoading(false);
      return;
    }

    try {
      const selectedUser = adminUsers.find((user) => user.id === userId);
      const selectedCondominium = condominiums.find(
        (condo) => condo.id === condominiumId
      );

      if (!selectedUser) {
        toast.error("Usuario no encontrado");
        setLoading(false);
        return;
      }

      if (!selectedCondominium) {
        toast.error("Condominio no encontrado");
        setLoading(false);
        return;
      }

      // Generar un folio de 10 caracteres
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const invoiceNumber = `INV-${randomSuffix}`;
      //TODO: REVISAR COMO SE ENVIA LA HORA
      const invoiceData: InvoiceData = {
        amount: parseFloat(amount),
        dueDate: new Date(dueDate + "T00:00:00"),
        optionalMessage: optionalMessage || "",
        userEmail: selectedUser.email,
        userUID: selectedUser.id,
        paymentStatus: "pending",
        createdAt: new Date(),
        concept: "Suscripción Mensual",
        invoiceNumber,
        isPaid: false,
        clientId,
        condominiumId,
        condominiumName: selectedCondominium.name,
      };

      const success = await createInvoice(
        clientId,
        condominiumId,
        invoiceData,
        file,
        xmlFile
      );

      if (success) {
        handleResetForm();
        setOpen(false);
        if (onSuccess) onSuccess();
        // Actualizar la tabla de facturas
        await resetInvoicesState();
        await fetchInvoices(20, null, {});
        toast.success("Factura creada exitosamente");
      }
    } catch (error) {
      console.error("Error al crear factura:", error);
      toast.error("Error al crear la factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          if (!loading) setOpen(false);
        }}
      >
        <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-gray-800">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="bg-gray-50 px-4 py-6 sm:px-6 dark:bg-gray-900">
                        <div className="flex items-start justify-between space-x-3">
                          <div className="space-y-1">
                            <Dialog.Title className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                              Nueva Factura
                            </Dialog.Title>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Complete todos los campos para crear una nueva
                              factura
                            </p>
                          </div>
                          <div className="flex h-7 items-center">
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                              onClick={() => setOpen(false)}
                              disabled={loading}
                            >
                              <span className="sr-only">Cerrar panel</span>
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Form */}
                      <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0 dark:sm:divide-gray-700">
                        <form
                          onSubmit={handleSubmit}
                          className="px-4 sm:px-6 lg:px-8"
                        >
                          <div className="space-y-6 pt-6 pb-5">
                            {/* Cliente */}
                            <div>
                              <label
                                htmlFor="client"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Cliente
                              </label>
                              <select
                                id="client"
                                name="client"
                                className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                disabled={loading}
                                required
                              >
                                <option value="">Seleccione un cliente</option>
                                {clients.map((client) => (
                                  <option key={client.id} value={client.id}>
                                    {client.companyName || client.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Condominio */}
                            <div>
                              <label
                                htmlFor="condominium"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Condominio
                              </label>
                              <select
                                id="condominium"
                                name="condominium"
                                className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                value={condominiumId}
                                onChange={(e) =>
                                  setCondominiumId(e.target.value)
                                }
                                disabled={
                                  loading ||
                                  !clientId ||
                                  condominiums.length === 0
                                }
                                required
                              >
                                <option value="">
                                  Seleccione un condominio
                                </option>
                                {condominiums.map((condominium) => (
                                  <option
                                    key={condominium.id}
                                    value={condominium.id}
                                  >
                                    {condominium.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Usuario Admin */}
                            <div>
                              <label
                                htmlFor="adminUser"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Usuario Administrador a notificar
                              </label>
                              <select
                                id="adminUser"
                                name="adminUser"
                                className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                disabled={
                                  loading ||
                                  !condominiumId ||
                                  adminUsers.length === 0
                                }
                                required
                              >
                                <option value="">
                                  Seleccione un administrador
                                </option>
                                {adminUsers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.displayName || user.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Monto */}
                            <div>
                              <label
                                htmlFor="amount"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Monto (MXN)
                              </label>
                              <div className="mt-2">
                                <input
                                  type="number"
                                  name="amount"
                                  id="amount"
                                  step="0.01"
                                  min="0"
                                  className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  disabled={loading}
                                  required
                                />
                              </div>
                            </div>

                            {/* Fecha de Vencimiento */}
                            <div>
                              <label
                                htmlFor="dueDate"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Fecha de Vencimiento
                              </label>
                              <div className="mt-2">
                                <input
                                  type="date"
                                  name="dueDate"
                                  id="dueDate"
                                  className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                  value={dueDate}
                                  onChange={(e) => setDueDate(e.target.value)}
                                  disabled={loading}
                                  required
                                />
                              </div>
                            </div>

                            {/* Archivo de Factura PDF */}
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Archivo de Factura (PDF)
                              </label>
                              <div
                                {...getRootProps()}
                                className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-500"
                              >
                                <div className="text-center">
                                  <DocumentPlusIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                  />
                                  <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    <input
                                      {...getInputProps()}
                                      id="file-upload"
                                      disabled={loading}
                                    />
                                    {fileName ? (
                                      <p className="pl-1">{fileName}</p>
                                    ) : (
                                      <p className="pl-1">
                                        {isDragActive
                                          ? "Suelta el archivo aquí..."
                                          : "Arrastra y suelta el PDF aquí o haz clic para seleccionarlo"}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                                    PDF, PNG o JPG hasta 10MB
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Archivo XML */}
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Archivo XML (Opcional)
                              </label>
                              <div
                                {...getXmlRootProps()}
                                className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-500"
                              >
                                <div className="text-center">
                                  <DocumentPlusIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                  />
                                  <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    <input
                                      {...getXmlInputProps()}
                                      id="xml-upload"
                                      disabled={loading}
                                    />
                                    {xmlFileName ? (
                                      <p className="pl-1">{xmlFileName}</p>
                                    ) : (
                                      <p className="pl-1">
                                        {isXmlDragActive
                                          ? "Suelta el archivo XML aquí..."
                                          : "Arrastra y suelta el XML aquí o haz clic para seleccionarlo"}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                                    Archivo XML hasta 5MB
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Mensaje Opcional */}
                            <div>
                              <label
                                htmlFor="optionalMessage"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
                              >
                                Mensaje Opcional
                              </label>
                              <div className="mt-2">
                                <textarea
                                  id="optionalMessage"
                                  name="optionalMessage"
                                  rows={3}
                                  className="w-full px-2 mt-2 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                  placeholder="Información adicional para el cliente..."
                                  value={optionalMessage}
                                  onChange={(e) =>
                                    setOptionalMessage(e.target.value)
                                  }
                                  disabled={loading}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
                            <div className="flex justify-end space-x-3">
                              <button
                                type="button"
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                              >
                                {loading ? "Guardando..." : "Guardar"}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default InvoiceCreationModal;
