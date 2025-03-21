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
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { usePaymentStore } from "../../../../store/usePaymentStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { usePaymentSummaryStore } from "../../../../store/paymentSummaryStore";
import { useUnidentifiedPaymentsStore } from "../../../../store/useUnidentifiedPaymentsStore";

interface FormParcelReceptionProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SelectedCharge {
  chargeId: string;
  amount: number;
}

const PaymentForm = ({ open, setOpen }: FormParcelReceptionProps) => {
  // Estados generales
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Campos del formulario
  const [email, setEmail] = useState<string>("");
  const [numberCondominium, setNumberCondominium] = useState<string>("");

  // Monto abonado: valor raw y su versión visual formateada
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [amountPaidDisplay, setAmountPaidDisplay] = useState<string>("");

  // Monto pendiente: valor raw y su versión visual formateada
  const [amountPending, setAmountPending] = useState<string>("");
  const [amountPendingDisplay, setAmountPendingDisplay] = useState<string>("");

  const [comments, setComments] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");

  // Fecha y hora de pago (se almacena como Date)
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);

  // ID de la cuenta financiera
  const [financialAccountId, setFinancialAccountId] = useState<string>("");

  // Estado para pago NO identificado
  const [isUnidentifiedPayment, setIsUnidentifiedPayment] = useState<boolean>(false);

  // Archivo adjunto
  const [file, setFile] = useState<File | File[] | null>(null);
  const [fileName, setFileName] = useState("");

  // Usuario seleccionado y uso de saldo a favor
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [useCreditBalance, setUseCreditBalance] = useState<boolean>(false);

  // Estado para cargos seleccionados
  const [selectedCharges, setSelectedCharges] = useState<SelectedCharge[]>([]);
  // Estado para almacenar los valores visuales de cada cargo (por su id)
  const [chargeDisplayValues, setChargeDisplayValues] = useState<{ [key: string]: string }>({});

  // Stores
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  const {
    charges,
    addMaintenancePayment,
    fetchUserCharges,
    financialAccounts,
    fetchFinancialAccounts,
  } = usePaymentStore((state) => ({
    charges: state.charges,
    addMaintenancePayment: state.addMaintenancePayment,
    fetchUserCharges: state.fetchUserCharges,
    financialAccounts: state.financialAccounts,
    fetchFinancialAccounts: state.fetchFinancialAccounts,
  }));

  const { fetchSummary, selectedYear, setupRealtimeListeners } = usePaymentSummaryStore((state) => ({
    fetchSummary: state.fetchSummary,
    selectedYear: state.selectedYear,
    setupRealtimeListeners: state.setupRealtimeListeners,
  }));

  const { fetchPayments } = useUnidentifiedPaymentsStore();

  useEffect(() => {
    fetchCondominiumsUsers();
    if (condominiumsUsers) {
      setUsers(condominiumsUsers);
    }
    fetchFinancialAccounts();
  }, [fetchCondominiumsUsers, fetchFinancialAccounts, condominiumsUsers]);

  // Helper para formatear a pesos mexicanos
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const handleRecipientChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uid = e.target.value;
    const user = users.find((u) => u.uid === uid);
    if (user) {
      setEmail(user.email);
      setNumberCondominium(user.number || "");
      setSelectedUser(user);
      if (user.number) {
        try {
          // Actualizar cargos y datos del usuario en paralelo
          await Promise.all([
            fetchUserCharges(user.number),
            fetchCondominiumsUsers()
          ]);
          // Obtener el usuario actualizado del store
          const updatedUser = condominiumsUsers.find(u => u.uid === uid);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        } catch (err) {
          console.error("Error actualizando datos del usuario:", err);
          toast.error("Error al cargar los datos del usuario");
        }
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

  // Sumar montos asignados
  const totalAssigned = selectedCharges.reduce((sum, sc) => sum + sc.amount, 0);

  // Convertir el saldo a favor del usuario (que viene en centavos) a pesos
  const userCreditInPesos =
    selectedUser && selectedUser.totalCreditBalance
      ? Number(selectedUser.totalCreditBalance) / 100
      : 0;

  // Si se usa crédito, sumar el saldo convertido
  const effectiveTotal =
    useCreditBalance && selectedUser
      ? Number(amountPaid) + userCreditInPesos
      : Number(amountPaid);

  // Calcular el crédito usado
  const creditUsed = useCreditBalance ? userCreditInPesos : 0;

  const remainingEffective = effectiveTotal - totalAssigned;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Validaciones iniciales
      if (!paymentDate) {
        throw new Error("La fecha de pago es obligatoria.");
      }
      if (!financialAccountId) {
        throw new Error("La cuenta es obligatoria.");
      }
      if (!amountPaid && !useCreditBalance) {
        throw new Error("El campo 'monto abonado' es obligatorio.");
      }
      if (!paymentType) {
        throw new Error("El campo 'tipo de pago' es obligatorio.");
      }

      // Validaciones para pago identificado
      if (!isUnidentifiedPayment) {
        if (!amountPending) {
          throw new Error("El campo 'monto pendiente' es obligatorio.");
        }
        if (selectedCharges.length === 0) {
          throw new Error("Debes seleccionar al menos un cargo para aplicar el pago.");
        }
        if (useCreditBalance) {
          if (Number(effectiveTotal).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
            throw new Error("En pago con saldo a favor, la suma de montos asignados debe ser igual a (monto abonado + crédito disponible).");
          }
        } else {
          if (Number(amountPaid).toFixed(2) !== Number(totalAssigned).toFixed(2)) {
            throw new Error("El monto abonado debe coincidir exactamente con la suma de los cargos asignados.");
          }
        }
        if (useCreditBalance && (!selectedUser?.totalCreditBalance || Number(selectedUser.totalCreditBalance) / 100 <= 0)) {
          throw new Error("No tienes saldo a favor disponible.");
        }
      }

      // Extraer los conceptos y el campo startAt de los cargos seleccionados
      const concepts = selectedCharges.map((sc) => {
        const foundCharge = charges.find((c) => c.id === sc.chargeId);
        return foundCharge ? foundCharge.concept : "";
      });
      const startAts = selectedCharges.map((sc) => {
        const foundCharge = charges.find((c) => c.id === sc.chargeId);
        return foundCharge ? foundCharge.startAt : "";
      }).filter((startAt): startAt is string => startAt !== undefined);

      const paymentObj = {
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
        financialAccountId,
        creditUsed,
        isUnidentifiedPayment,
        concepts,   // Se envía el concepto del cargo
        startAts,   // Ahora es string[]
        ...(isUnidentifiedPayment && { appliedToUser: false }),
      };

      // Intentar registrar el pago
      await addMaintenancePayment(paymentObj);

      // Actualizar datos en paralelo
      await Promise.all([
        setupRealtimeListeners(selectedYear),
        fetchSummary(selectedYear),
        fetchUserCharges(numberCondominium),
        fetchCondominiumsUsers(),
        isUnidentifiedPayment && fetchPayments(),
      ].filter(Boolean));

      // Resetear el formulario y notificar
      resetForm();
      toast.success("Pago registrado correctamente");
      setOpen(false);
    } catch (error: any) {
      console.error("Error en el proceso de pago:", error);
      toast.error(error.message || "Error al procesar el pago. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setEmail("");
    setNumberCondominium("");
    setAmountPaid("");
    setAmountPaidDisplay("");
    setAmountPending("");
    setAmountPendingDisplay("");
    setComments("");
    setPaymentType("");
    setFile(null);
    setFileName("");
    setSelectedCharges([]);
    setChargeDisplayValues({});
    setSelectedUser(null);
    setUseCreditBalance(false);
    setPaymentDate(null);
    setFinancialAccountId("");
    setIsUnidentifiedPayment(false);
  };

  const dropzoneOptions = {
    accept: [".xls", ".xlsx"] as any,
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);
    },
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const handlePaymentTypeChange = (isUnidentified: boolean) => {
    setIsUnidentifiedPayment(isUnidentified);

    if (isUnidentified) {
      // Resetear campos cuando se cambia a pago no identificado
      setEmail("");
      setNumberCondominium("");
      setSelectedUser(null);
      setSelectedCharges([]);
      setAmountPending("");
      setAmountPendingDisplay("");
      setUseCreditBalance(false);
    }
  };

  // Función auxiliar para ajustar la zona horaria
  const adjustTimezone = (date: Date): Date => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  };

  // Función para formatear la fecha para el input
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const adjustedDate = adjustTimezone(date);
    return adjustedDate.toISOString().slice(0, 16);
  };

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
                  <form onSubmit={handleSubmit} className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                    <div className="h-0 flex-1 overflow-y-auto dark:bg-gray-900">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Registrar pago
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
                            Registra un nuevo pago para un condómino.
                          </p>
                        </div>
                        <div className="mt-4">
                          <span className="block text-sm font-medium leading-6 text-white">
                            Tipo de registro
                          </span>
                          <div className="mt-2 flex items-center space-x-4">
                            <label className="flex items-center text-white">
                              <input
                                type="radio"
                                name="paymentIdentification"
                                value="identified"
                                checked={!isUnidentifiedPayment}
                                onChange={() => handlePaymentTypeChange(false)}
                                className="mr-2"
                              />
                              Pago identificado
                            </label>
                            <label className="flex items-center text-white">
                              <input
                                type="radio"
                                name="paymentIdentification"
                                value="unidentified"
                                checked={isUnidentifiedPayment}
                                onChange={() => handlePaymentTypeChange(true)}
                                className="mr-2"
                              />
                              Pago no identificado
                            </label>
                          </div>
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
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  onChange={handleRecipientChange}
                                  name="nameRecipient"
                                  id="nameRecipient"
                                  disabled={isUnidentifiedPayment}
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={users.find((u) => u.number === numberCondominium)?.uid || ""}
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
                            {/* Fecha y hora de pago */}
                            <div>
                              <label
                                htmlFor="paymentDate"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Fecha y hora de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  onChange={(e) => {
                                    const selectedDate = new Date(e.target.value);
                                    setPaymentDate(selectedDate);
                                  }}
                                  type="datetime-local"
                                  name="paymentDate"
                                  id="paymentDate"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={formatDateForInput(paymentDate)}
                                />
                              </div>
                            </div>
                            {/* Monto abonado */}
                            <div>
                              <label
                                htmlFor="amountPaid"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto abonado
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="amountPaid"
                                  id="amountPaid"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={amountPaidDisplay}
                                  onChange={(e) => {
                                    setAmountPaid(e.target.value);
                                    setAmountPaidDisplay(e.target.value);
                                  }}
                                  onFocus={() => setAmountPaidDisplay(amountPaid)}
                                  onBlur={() => {
                                    const num = parseFloat(amountPaid);
                                    if (!isNaN(num)) {
                                      setAmountPaidDisplay(formatCurrency(num));
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            {/* Tipo de pago */}
                            <div>
                              <label
                                htmlFor="paymentType"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Tipo de pago
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  onChange={(e) => setPaymentType(e.target.value)}
                                  name="paymentType"
                                  id="paymentType"
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
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
                            {/* Selección de la cuenta */}
                            <div>
                              <label
                                htmlFor="financialAccountId"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Cuenta
                              </label>
                              <div className="mt-2 relative">
                                <select
                                  onChange={(e) => setFinancialAccountId(e.target.value)}
                                  name="financialAccountId"
                                  id="financialAccountId"
                                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                                  value={financialAccountId}
                                >
                                  <option value="">Selecciona una cuenta</option>
                                  {financialAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                      {acc.name}
                                    </option>
                                  ))}
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
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="amountPending"
                                  id="amountPending"
                                  disabled={isUnidentifiedPayment}
                                  className="px-8 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
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
                                        />
                                        <span className="flex-1 dark:text-gray-100">
                                          {`${charge.concept} | Mes: ${charge.month || "Sin mes"} | Monto: ${formatCurrency(charge.amount / 100)}`}
                                        </span>
                                        {isChecked && (
                                          <div className="relative">
                                            <input
                                              type="text"
                                              min="0"
                                              step="0.01"
                                              className="w-18 rounded-md ring-0 focus:ring-0 outline-none border border-solid border-indigo-300 pl-5 h-8 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                              placeholder="$ Monto a aplicar"
                                              value={chargeDisplayValues[charge.id] || ""}
                                              onChange={(e) => {
                                                const rawValue = e.target.value;
                                                const newNumber = parseFloat(rawValue.replace(/[^0-9.]/g, '')) || 0;
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
                            {/* Dropzone */}
                            <div {...getRootProps()} className="mt-12 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-900">
                              <input {...getInputProps()} />
                              <div className="text-center">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                {fileName ? (
                                  <p className="mt-4 text-sm leading-6 text-gray-600">{fileName}</p>
                                ) : (
                                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                    {isDragActive ? "Suelta el archivo aquí..." : "Arrastra y suelta el comprobante aquí o haz click para seleccionarlo"}
                                  </p>
                                )}
                                <p className="text-xs leading-5 text-gray-600">Hasta 10MB</p>
                              </div>
                            </div>
                            {/* Comentarios */}
                            <div>
                              <label htmlFor="comments" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  onChange={(e) => setComments(e.target.value)}
                                  id="comments"
                                  name="comments"
                                  rows={4}
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
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
                          <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full" viewBox="0 0 24 24"></svg>
                        ) : (
                          "Guardar"
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

export default PaymentForm;
