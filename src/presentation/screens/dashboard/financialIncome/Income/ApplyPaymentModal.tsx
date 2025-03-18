import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import {
  PhotoIcon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ClipboardIcon,
  CalendarIcon,
} from "@heroicons/react/16/solid";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import useUserStore from "../../../../../store/UserDataStore";
import { UserData } from "../../../../../interfaces/UserData";
import { usePaymentStore } from "../../../../../store/usePaymentStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { useUnidentifiedPaymentsStore } from "../../../../../store/useUnidentifiedPaymentsStore";

interface ApplyPaymentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  amount: number; // Monto a aplicar (en pesos) – valor inmutable
  paymentDate: any;
  paymentType: string;
  attachmentPayment?: string; // URL que llega desde el pago no identificado
  financialAccountId: string; // Valor recibido desde los props
  paymentId?: string; // ID del pago no identificado
}

interface SelectedCharge {
  chargeId: string;
  amount: number;
}

const ApplyPaymentModal = ({
  open,
  setOpen,
  amount,
  paymentDate: propPaymentDate,
  paymentType: propPaymentType,
  attachmentPayment: propAttachmentPayment, // Comprobante que llega del registro
  financialAccountId: propFinancialAccountId, // Cuenta donde se registra el pago
  paymentId: propPaymentId, // ID del pago no identificado
}: ApplyPaymentModalProps) => {
  console.log("paymentId", propPaymentId);
  // ---------------------------
  //  Estados locales
  // ---------------------------
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Campos del formulario
  const [email, setEmail] = useState<string>("");
  const [numberCondominium, setNumberCondominium] = useState<string>("");
  // El monto abonado se inicializa con el valor recibido, pero se mantendrá como string
  const [amountPaid, setAmountPaid] = useState<string>(amount.toString());
  // Monto pendiente: estado raw y visual
  const [amountPending, setAmountPending] = useState<string>("");
  const [amountPendingDisplay, setAmountPendingDisplay] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  // paymentType y paymentDate (solo lectura)
  const [paymentType, setPaymentType] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);

  // La cuenta financiera es de solo lectura
  const [_financialAccountId, setFinancialAccountId] = useState<string>("");

  // Indica que NO es pago no identificado
  const isUnidentifiedPayment = false;

  // Archivo adjunto (drag & drop)
  const [file, setFile] = useState<File | File[] | null>(null);
  const [fileName, setFileName] = useState("");

  // Usuario seleccionado y cargos
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [useCreditBalance, setUseCreditBalance] = useState<boolean>(false);
  const [selectedCharges, setSelectedCharges] = useState<SelectedCharge[]>([]);
  // Estado para valores visuales de cada cargo
  const [chargeDisplayValues, setChargeDisplayValues] = useState<{ [key: string]: string }>({});

  // ---------------------------
  //  Stores
  // ---------------------------
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  const {
    charges,
    addMaintenancePayment,
    fetchUserCharges,
    fetchFinancialAccounts,
    editUnidentifiedPayment, // <--- Función para editar pago no identificado
  } = usePaymentStore((state) => ({
    charges: state.charges,
    addMaintenancePayment: state.addMaintenancePayment,
    fetchUserCharges: state.fetchUserCharges,
    financialAccounts: state.financialAccounts,
    fetchFinancialAccounts: state.fetchFinancialAccounts,
    editUnidentifiedPayment: state.editUnidentifiedPayment,
  }));

  const { fetchSummary, selectedYear } = usePaymentSummaryStore((state) => ({
    fetchSummary: state.fetchSummary,
    selectedYear: state.selectedYear,
  }));

  // Agregamos fetchPayments del store de pagos no identificados
  const { fetchPayments } = useUnidentifiedPaymentsStore();

  // ---------------------------
  //  useEffect y configuración inicial
  // ---------------------------
  useEffect(() => {
    if (propPaymentDate) {
      if (propPaymentDate.toDate) {
        setPaymentDate(propPaymentDate.toDate());
      } else {
        setPaymentDate(new Date(propPaymentDate));
      }
    }
    if (propPaymentType) {
      setPaymentType(propPaymentType);
    }
  }, [propPaymentDate, propPaymentType]);

  // La cuenta financiera recibida por props
  useEffect(() => {
    if (propFinancialAccountId) {
      setFinancialAccountId(propFinancialAccountId);
    }
  }, [propFinancialAccountId]);

  // Cargar usuarios y cuentas
  useEffect(() => {
    fetchCondominiumsUsers();
    if (condominiumsUsers) {
      setUsers(condominiumsUsers);
    }
    fetchFinancialAccounts();
  }, [fetchCondominiumsUsers, fetchFinancialAccounts, condominiumsUsers]);

  // Helper para formatear a moneda mexicana
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  // ---------------------------
  //  Manejo de selects y cargos
  // ---------------------------
  const handleRecipientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    const user = users.find((u) => u.uid === uid);
    if (user) {
      setEmail(user.email);
      setNumberCondominium(user.number || "");
      setSelectedUser(user);
      if (user.number) {
        fetchUserCharges(user.number).catch((err) =>
          console.error("Error fetching user charges:", err)
        );
      }
      setSelectedCharges([]);
    }
  };

  const handleToggleCharge = (chargeId: string, checked: boolean) => {
    if (checked) {
      setSelectedCharges((prev) => [...prev, { chargeId, amount: 0 }]);
    } else {
      setSelectedCharges((prev) => prev.filter((sc) => sc.chargeId !== chargeId));
    }
  };

  const handleAmountChange = (chargeId: string, newAmount: number) => {
    setSelectedCharges((prev) =>
      prev.map((sc) =>
        sc.chargeId === chargeId ? { ...sc, amount: newAmount } : sc
      )
    );
  };

  // ---------------------------
  //  Cálculos de saldos
  // ---------------------------
  const totalAssigned = selectedCharges.reduce((sum, sc) => sum + sc.amount, 0);
  const userCreditInPesos =
    selectedUser && selectedUser.totalCreditBalance
      ? Number(selectedUser.totalCreditBalance) / 100
      : 0;
  const effectiveTotal =
    useCreditBalance && selectedUser
      ? Number(amountPaid) + userCreditInPesos
      : Number(amountPaid);
  const creditUsed = useCreditBalance ? userCreditInPesos : 0;
  const remainingEffective = effectiveTotal - totalAssigned;

  // ---------------------------
  //  Drag & drop
  // ---------------------------
  const dropzoneOptions = {
    accept: [".xls", ".xlsx"] as any,
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);
    },
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  // ---------------------------
  //  Submit
  // ---------------------------
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    // Validaciones
    if (!paymentDate) {
      toast.error("La fecha de pago es obligatoria.");
      setLoading(false);
      return;
    }
    if (!amountPaid && !useCreditBalance) {
      toast.error("El monto abonado es obligatorio.");
      setLoading(false);
      return;
    }
    if (!paymentType) {
      toast.error("El campo 'tipo de pago' es obligatorio.");
      setLoading(false);
      return;
    }
    if (!amountPending) {
      toast.error("El campo 'monto pendiente' es obligatorio.");
      setLoading(false);
      return;
    }
    if (selectedCharges.length === 0) {
      toast.error("Debes seleccionar al menos un cargo para aplicar el pago.");
      setLoading(false);
      return;
    }
    if (useCreditBalance) {
      if (Number(effectiveTotal).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
        toast.error(
          "En pago con saldo a favor, la suma de montos asignados debe ser igual a (monto abonado + crédito disponible)."
        );
        setLoading(false);
        return;
      }
    } else {
      if (Number(amountPaid).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
        toast.error(
          "El monto abonado debe coincidir exactamente con la suma de los cargos asignados."
        );
        setLoading(false);
        return;
      }
    }
    if (
      useCreditBalance &&
      (!selectedUser?.totalCreditBalance || Number(selectedUser.totalCreditBalance) / 100 <= 0)
    ) {
      toast.error("No tienes saldo a favor disponible.");
      setLoading(false);
      return;
    }

    try {
      // Determina la URL final del comprobante
      const finalAttachment = propAttachmentPayment
        ? propAttachmentPayment
        : file
        ? file
        : "";

      // Construir payload para aplicar el pago
      const paymentObj: any = {
        email,
        numberCondominium,
        amountPaid: Number(amountPaid),
        amountPending: Number(amountPending),
        comments,
        file,
        selectedCharges,
        useCreditBalance,
        paymentType,
        paymentDate: paymentDate.toISOString(),
        financialAccountId: propFinancialAccountId,
        creditUsed,
        attachmentPayment: finalAttachment,
        appliedToUser: "true",
      };

      // (1) Crear el pago identificado para el usuario
      await addMaintenancePayment(paymentObj);

      // (2) Si existe paymentId (pago no identificado), lo editamos
      if (propPaymentId) {
        await editUnidentifiedPayment(propPaymentId);
      }

      // Resetear formulario
      setEmail("");
      setNumberCondominium("");
      setAmountPaid(amount.toString());
      setAmountPending("");
      setAmountPendingDisplay("");
      setComments("");
      setPaymentType("");
      setFile(null);
      setFileName("");
      setSelectedCharges([]);
      setSelectedUser(null);
      setUseCreditBalance(false);
      setPaymentDate(null);

      setOpen(false);
      setLoading(false);
      toast.success("Pago aplicado correctamente");

      // Actualizamos la lista de pagos no identificados
      await fetchPayments();
      // Actualizamos el resumen
      fetchSummary(selectedYear);
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error("Error al aplicar el pago");
    }
  };

  // ---------------------------
  //  Render
  // ---------------------------
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl dark:bg-gray-900"
                  >
                    <div className="h-0 flex-1 overflow-y-auto">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Aplicar pago
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            Aplica el pago al usuario seleccionado.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            {/* Seleccionar condómino */}
                            <div>
                              <label
                                htmlFor="nameRecipient"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Condómino
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  onChange={handleRecipientChange}
                                  name="nameRecipient"
                                  id="nameRecipient"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={
                                    users.find((u) => u.number === numberCondominium)?.uid || ""
                                  }
                                >
                                  <option value="">Selecciona un condómino</option>
                                  {users
                                    .filter(
                                      (user) =>
                                        user.role !== "admin" &&
                                        user.role !== "super-admin" &&
                                        user.role !== "security"
                                    )
                                    .map((user) => (
                                      <option key={user.uid} value={user.uid}>
                                        {user.number} {user.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            {/* Fecha y hora de pago (solo lectura) */}
                            <div>
                              <label
                                htmlFor="paymentDate"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Fecha y hora de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  disabled
                                  type="datetime-local"
                                  name="paymentDate"
                                  id="paymentDate"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={
                                    paymentDate ? paymentDate.toISOString().slice(0, 16) : ""
                                  }
                                />
                              </div>
                            </div>

                            {/* Monto abonado (solo lectura) */}
                            <div>
                              <label
                                htmlFor="amountPaid"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto abonado
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  readOnly
                                  name="amountPaid"
                                  id="amountPaid"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={amountPaid ? formatCurrency(Number(amountPaid)) : ""}
                                />
                              </div>
                            </div>

                            {/* Tipo de pago (solo lectura) */}
                            <div>
                              <label
                                htmlFor="paymentType"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Tipo de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  disabled
                                  name="paymentType"
                                  id="paymentType"
                                  className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 opacity-80 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={paymentType}
                                >
                                  <option value="">Selecciona un tipo de pago</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Depósito">Depósito</option>
                                </select>
                              </div>
                            </div>

                            {/* Monto pendiente */}
                            <div>
                              <label
                                htmlFor="amountPending"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto pendiente
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="amountPending"
                                  id="amountPending"
                                  disabled={isUnidentifiedPayment}
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={amountPendingDisplay}
                                  onChange={(e) => {
                                    setAmountPending(e.target.value);
                                    setAmountPendingDisplay(e.target.value);
                                  }}
                                  onFocus={() => setAmountPendingDisplay(amountPending)}
                                  onBlur={() => {
                                    const num = parseFloat(amountPending);
                                    if (!isNaN(num)) {
                                      setAmountPendingDisplay(formatCurrency(num));
                                    } else {
                                      setAmountPendingDisplay("");
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            {/* Saldo a favor */}
                            {selectedUser && !isUnidentifiedPayment && Number(selectedUser.totalCreditBalance) > 0 && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                  Saldo a favor disponible: {formatCurrency(Number(selectedUser.totalCreditBalance) / 100)}
                                </label>
                                <div className="mt-2 flex items-center space-x-4">
                                  <label className="flex items-center dark:text-gray-100">
                                    <input
                                      type="radio"
                                      name="useCreditBalance"
                                      value="false"
                                      checked={!useCreditBalance}
                                      onChange={() => setUseCreditBalance(false)}
                                      className="mr-2"
                                    />
                                    No utilizar saldo a favor
                                  </label>
                                  <label className="flex items-center dark:text-gray-100">
                                    <input
                                      type="radio"
                                      name="useCreditBalance"
                                      value="true"
                                      checked={useCreditBalance}
                                      onChange={() => setUseCreditBalance(true)}
                                      className="mr-2"
                                    />
                                    Utilizar saldo a favor
                                  </label>
                                </div>
                              </div>
                            )}

                            {/* Lista de cargos pendientes */}
                            {numberCondominium && charges.length > 0 && !isUnidentifiedPayment && (
                              <div>
                                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                  Selecciona cargos a pagar
                                </label>
                                <div className="mt-2 space-y-2">
                                  {charges.map((charge) => {
                                    const isChecked = selectedCharges.some((sc) => sc.chargeId === charge.id);
                                    return (
                                      <div key={charge.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          disabled={isUnidentifiedPayment}
                                          checked={isChecked}
                                          onChange={(e) => handleToggleCharge(charge.id, e.target.checked)}
                                          className="accent-indigo-600 dark:accent-indigo-400"
                                        />
                                        <span className="flex-1 dark:text-gray-100">
                                          {`${charge.concept} | Mes: ${charge.month || "Sin mes"} | Monto: ${formatCurrency(charge.amount / 100)}`}
                                        </span>
                                        {isChecked && (
                                          <div className="relative">
                                            <input
                                              type="text"
                                              min="0"
                                              step="any"
                                              className="w-18 rounded-md border-gray-300 pl-5 h-8 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                                              placeholder="Monto a aplicar"
                                              value={chargeDisplayValues[charge.id] || ""}
                                              onChange={(e) => {
                                                const rawValue = e.target.value;
                                                const newNumber = parseFloat(rawValue.replace(/[^0-9.]/g, "")) || 0;
                                                handleAmountChange(charge.id, newNumber);
                                                setChargeDisplayValues((prev) => ({ ...prev, [charge.id]: rawValue }));
                                              }}
                                              onFocus={() => {
                                                const selected = selectedCharges.find((sc) => sc.chargeId === charge.id);
                                                if (selected) {
                                                  setChargeDisplayValues((prev) => ({ ...prev, [charge.id]: selected.amount.toString() }));
                                                }
                                              }}
                                              onBlur={() => {
                                                const selected = selectedCharges.find((sc) => sc.chargeId === charge.id);
                                                if (selected) {
                                                  setChargeDisplayValues((prev) => ({ ...prev, [charge.id]: formatCurrency(selected.amount) }));
                                                }
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2">
                                  <span className="text-sm font-bold dark:text-gray-100">
                                    Saldo restante a aplicar: {formatCurrency(remainingEffective)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-indigo-500 font-bold dark:text-gray-100 m-0">
                                *En caso de que no se seleccione un comprobante se usará el previamente cargado en el pago.
                              </p>
                            </div>

                            {/* Dropzone para adjuntar comprobante */}
                            <div
                              {...getRootProps()}
                              className="mt-6 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-900"
                            >
                              <input {...getInputProps()} />
                              <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                {fileName ? (
                                  <p className="mt-4 text-sm leading-6 text-gray-600">{fileName}</p>
                                ) : (
                                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                    {isDragActive
                                      ? "Suelta el archivo aquí..."
                                      : "Arrastra y suelta el comprobante aquí o haz click para seleccionarlo"}
                                  </p>
                                )}
                                <p className="text-xs leading-5 text-gray-600">Hasta 10MB</p>
                              </div>
                            </div>

                            {/* Comentarios */}
                            <div>
                              <label
                                htmlFor="comments"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  onChange={(e) => setComments(e.target.value)}
                                  id="comments"
                                  name="comments"
                                  rows={4}
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={comments}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-shrink-0 justify-end px-4 py-4 dark:bg-gray-900">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={() => setOpen(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {loading ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
                            viewBox="0 0 24 24"
                          ></svg>
                        ) : (
                          "Aplicar"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ApplyPaymentModal;
