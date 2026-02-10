import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition, Dialog, Combobox } from "@headlessui/react";
import {
  PhotoIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClipboardIcon,
  CreditCardIcon,
  CalendarIcon,
  PencilIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  useExpenseStore,
  ExpenseCreateInput,
} from "../../../../store/expenseStore";
import { EXPENSE_CONCEPTS } from "../../../../utils/expensesList";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, getIdTokenResult } from "firebase/auth";
import { useExpenseSummaryStore } from "../../../../store/expenseSummaryStore";
import useProviderStore from "../../../../store/providerStore";
import { useFileCompression } from "../../../../hooks/useFileCompression";

interface ExpenseFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface FinancialAccount {
  id: string;
  name: string;
}

const PAYMENT_TYPES = [
  "Efectivo",
  "Transferencia",
  "Tarjeta",
  "Cheque",
  "Depósito",
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, setOpen }) => {
  const [amount, setAmount] = useState<string>("");
  const [amountDisplay, setAmountDisplay] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [financialAccountId, setFinancialAccountId] = useState<string>("");
  const [financialAccounts, setFinancialAccounts] = useState<
    FinancialAccount[]
  >([]);
  const [providerId, setProviderId] = useState<string>("");
  const [providerSearch, setProviderSearch] = useState<string>("");
  const [conceptSearch, setConceptSearch] = useState<string>("");
  const providerComboboxButtonRef = useRef<HTMLButtonElement | null>(null);
  const conceptComboboxButtonRef = useRef<HTMLButtonElement | null>(null);
  const { providers, fetchProviders } = useProviderStore();
  const { compressFile, isCompressing } = useFileCompression();

  const { addExpense } = useExpenseStore();
  const { fetchSummary, selectedYear, setupRealtimeListeners } =
    useExpenseSummaryStore();

  const dropzoneOptions = {
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        try {
          const compressed = await compressFile(acceptedFiles[0]);
          setFile(compressed);
          setFileName(compressed.name);
          toast.success("Comprobante procesado");
        } catch (error) {
          console.error(error);
          setFile(acceptedFiles[0]);
          setFileName(acceptedFiles[0].name);
        }
      }
    },
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
      "application/pdf": [".pdf"],
    },
  };
  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  // Función para cargar las cuentas financieras
  const fetchFinancialAccounts = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");
      if (!condominiumId) throw new Error("Condominio no seleccionado");

      const db = getFirestore();
      const accountsRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/financialAccounts`
      );
      const snapshot = await getDocs(accountsRef);
      const accounts: FinancialAccount[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "Sin nombre",
      }));
      setFinancialAccounts(accounts);
    } catch (error) {
      console.error("Error al cargar cuentas:", error);
      toast.error("Error al cargar las cuentas financieras");
    }
  };

  useEffect(() => {
    if (open) {
      fetchFinancialAccounts();
      fetchProviders();
      setAmount("");
      setAmountDisplay("");
      setConcept("");
      setPaymentType("");
      setExpenseDate("");
      setDescription("");
      setFile(null);
      setFileName("");
      setLoading(false);
      setFinancialAccountId("");
      setProviderId("");
      setProviderSearch("");
      setConceptSearch("");
    }
  }, [open]);

  const filteredProviders = useMemo(() => {
    const term = providerSearch.trim().toLowerCase();
    if (!term) return providers;

    return providers.filter((provider) => {
      const providerName = (provider.name || "").toLowerCase();
      const providerService = (provider.serviceLabel || "").toLowerCase();
      return providerName.includes(term) || providerService.includes(term);
    });
  }, [providers, providerSearch]);

  const filteredExpenseConcepts = useMemo(() => {
    const term = conceptSearch.trim().toLowerCase();
    if (!term) return EXPENSE_CONCEPTS;

    return EXPENSE_CONCEPTS.filter((expenseConcept) =>
      expenseConcept.toLowerCase().includes(term)
    );
  }, [conceptSearch]);

  const getProviderLabel = (id: string) => {
    if (!id) return "";
    const provider = providers.find((item) => item.id === id);
    return provider
      ? `${provider.name} - ${provider.serviceLabel}`
      : "Proveedor no disponible";
  };

  // Función para formatear a moneda mexicana (solo visual)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!amount) {
      toast.error("El campo 'monto del egreso' es obligatorio.");
      setLoading(false);
      return;
    }
    if (!concept) {
      toast.error("Selecciona un concepto de egreso.");
      setLoading(false);
      return;
    }
    if (!paymentType) {
      toast.error("Selecciona un tipo de pago.");
      setLoading(false);
      return;
    }
    if (!expenseDate) {
      toast.error("Selecciona la fecha en que se generó el egreso.");
      setLoading(false);
      return;
    }

    try {
      const amountInPesos = Number(amount);

      const dataToCreate: ExpenseCreateInput = {
        amount: amountInPesos,
        concept,
        paymentType,
        expenseDate,
        description,
        file: file || undefined,
        financialAccountId,
        providerId: providerId || undefined,
      };
      await addExpense(dataToCreate);

      // Actualizar datos en tiempo real
      setupRealtimeListeners(selectedYear);
      // Forzar actualización inmediata
      await fetchSummary(selectedYear);

      // Cerrar el formulario después de agregar el egreso
      setOpen(false);
      toast.success("Egreso registrado correctamente");
    } catch (error) {
      console.error("Error al crear egreso:", error);
      toast.error("Ocurrió un error al registrar el egreso.");
    } finally {
      setLoading(false);
    }
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
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  >
                    <div className="h-0 flex-1 overflow-y-auto dark:bg-gray-900">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Registrar Egreso
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            Registra un nuevo egreso para el condominio.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            {/* Monto del egreso */}
                            <div>
                              <label
                                htmlFor="amount"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Monto del Egreso
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  id="amount"
                                  name="amount"
                                  type="text"
                                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none block w-full rounded-md border-0 pl-8 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  placeholder="$0.00"
                                  value={amountDisplay}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    setAmount(rawValue);
                                    setAmountDisplay(rawValue);
                                  }}
                                  onFocus={() => setAmountDisplay(amount)}
                                  onBlur={() => {
                                    const num = parseFloat(amount);
                                    if (!isNaN(num)) {
                                      setAmountDisplay(formatCurrency(num));
                                    } else {
                                      setAmountDisplay("");
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            {/* Select de Proveedor */}
                            <div>
                              <label
                                htmlFor="providerId"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Proveedor (opcional)
                              </label>
                              <div className="mt-2 relative">
                                <Combobox
                                  value={providerId}
                                  onChange={(value: string) => {
                                    setProviderId(value);
                                    setProviderSearch("");
                                  }}
                                >
                                  <div className="relative">
                                    <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2 z-10">
                                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Combobox.Input
                                      id="providerId"
                                      name="providerId"
                                      className="block w-full rounded-md border-0 pl-10 pr-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                      displayValue={(id: string) =>
                                        getProviderLabel(id)
                                      }
                                      onChange={(event) =>
                                        setProviderSearch(event.target.value)
                                      }
                                      onFocus={() =>
                                        providerComboboxButtonRef.current?.click()
                                      }
                                      placeholder="Buscar proveedor por nombre o servicio"
                                    />
                                    <Combobox.Button
                                      ref={providerComboboxButtonRef}
                                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                                    >
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                    </Combobox.Button>
                                  </div>
                                  <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    <Combobox.Option
                                      value=""
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-8 pr-4 ${
                                          active
                                            ? "bg-indigo-600 text-white"
                                            : "text-gray-900 dark:text-gray-100"
                                        }`
                                      }
                                    >
                                      -- Sin proveedor --
                                    </Combobox.Option>
                                    {filteredProviders.length === 0 ? (
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                        Sin resultados
                                      </div>
                                    ) : (
                                      filteredProviders.map((provider) => (
                                        <Combobox.Option
                                          key={provider.id}
                                          value={provider.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-8 pr-4 ${
                                              active
                                                ? "bg-indigo-600 text-white"
                                                : "text-gray-900 dark:text-gray-100"
                                            }`
                                          }
                                        >
                                          {({ active }) => (
                                            <>
                                              <span
                                                className={`block truncate ${
                                                  providerId === provider.id
                                                    ? "font-medium"
                                                    : "font-normal"
                                                }`}
                                              >
                                                {provider.name} -{" "}
                                                {provider.serviceLabel}
                                              </span>
                                              {providerId === provider.id && (
                                                <span
                                                  className={`absolute inset-y-0 left-0 flex items-center pl-2 ${
                                                    active
                                                      ? "text-white"
                                                      : "text-indigo-600"
                                                  }`}
                                                >
                                                  <CheckIcon className="h-4 w-4" />
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </Combobox.Option>
                                      ))
                                    )}
                                  </Combobox.Options>
                                </Combobox>
                              </div>
                            </div>

                            {/* Concepto */}
                            <div>
                              <label
                                htmlFor="concept"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Concepto de Egreso
                              </label>
                              <div className="mt-2 relative">
                                <Combobox
                                  value={concept}
                                  onChange={(value: string) => {
                                    setConcept(value);
                                    setConceptSearch("");
                                  }}
                                >
                                  <div className="relative">
                                    <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2 z-10">
                                      <ClipboardIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Combobox.Input
                                      id="concept"
                                      name="concept"
                                      className="block w-full rounded-md border-0 pl-10 pr-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                      displayValue={(value: string) => value}
                                      onChange={(event) =>
                                        setConceptSearch(event.target.value)
                                      }
                                      onFocus={() =>
                                        conceptComboboxButtonRef.current?.click()
                                      }
                                      placeholder="Buscar concepto de egreso"
                                    />
                                    <Combobox.Button
                                      ref={conceptComboboxButtonRef}
                                      className="absolute inset-y-0 right-0 flex items-center pr-2"
                                    >
                                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                    </Combobox.Button>
                                  </div>
                                  <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    <Combobox.Option
                                      value=""
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-8 pr-4 ${
                                          active
                                            ? "bg-indigo-600 text-white"
                                            : "text-gray-900 dark:text-gray-100"
                                        }`
                                      }
                                    >
                                      -- Selecciona un concepto --
                                    </Combobox.Option>
                                    {filteredExpenseConcepts.length === 0 ? (
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                                        Sin resultados
                                      </div>
                                    ) : (
                                      filteredExpenseConcepts.map(
                                        (expenseConcept) => (
                                          <Combobox.Option
                                            key={expenseConcept}
                                            value={expenseConcept}
                                            className={({ active }) =>
                                              `relative cursor-default select-none py-2 pl-8 pr-4 ${
                                                active
                                                  ? "bg-indigo-600 text-white"
                                                  : "text-gray-900 dark:text-gray-100"
                                              }`
                                            }
                                          >
                                            {({ active }) => (
                                              <>
                                                <span
                                                  className={`block truncate ${
                                                    concept === expenseConcept
                                                      ? "font-medium"
                                                      : "font-normal"
                                                  }`}
                                                >
                                                  {expenseConcept}
                                                </span>
                                                {concept === expenseConcept && (
                                                  <span
                                                    className={`absolute inset-y-0 left-0 flex items-center pl-2 ${
                                                      active
                                                        ? "text-white"
                                                        : "text-indigo-600"
                                                    }`}
                                                  >
                                                    <CheckIcon className="h-4 w-4" />
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </Combobox.Option>
                                        )
                                      )
                                    )}
                                  </Combobox.Options>
                                </Combobox>
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
                                  id="paymentType"
                                  name="paymentType"
                                  className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={paymentType}
                                  onChange={(e) =>
                                    setPaymentType(e.target.value)
                                  }
                                >
                                  <option value="">
                                    -- Selecciona el tipo de pago --
                                  </option>
                                  {PAYMENT_TYPES.map((pt) => (
                                    <option key={pt} value={pt}>
                                      {pt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Selección de la cuenta financiera */}
                            <div>
                              <label
                                htmlFor="financialAccountId"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Cuenta Financiera
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                  id="financialAccountId"
                                  name="financialAccountId"
                                  value={financialAccountId}
                                  onChange={(e) =>
                                    setFinancialAccountId(e.target.value)
                                  }
                                  className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  required
                                >
                                  <option value="">
                                    -- Selecciona una cuenta --
                                  </option>
                                  {financialAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Fecha de egreso */}
                            <div>
                              <label
                                htmlFor="expenseDate"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Fecha del egreso
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  id="expenseDate"
                                  name="expenseDate"
                                  type="datetime-local"
                                  className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  value={expenseDate}
                                  onChange={(e) =>
                                    setExpenseDate(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Descripción */}
                            <div>
                              <label
                                htmlFor="description"
                                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                              >
                                Descripción (opcional)
                              </label>
                              <div className="mt-2 relative">
                                <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                                  <PencilIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                  id="description"
                                  name="description"
                                  rows={3}
                                  className="block w-full rounded-md border-0 pl-10 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                                  placeholder="Detalles adicionales del egreso"
                                  value={description}
                                  onChange={(e) =>
                                    setDescription(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Dropzone para factura/recibo */}
                            <div>
                              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                                Factura o Comprobante (opcional)
                              </label>
                              <div
                                {...getRootProps()}
                                className="mt-2 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-900"
                              >
                                <input {...getInputProps()} />
                                <div className="text-center">
                                  <PhotoIcon
                                    className="mx-auto h-12 w-12 text-gray-300"
                                    aria-hidden="true"
                                  />
                                  {fileName ? (
                                    <p className="mt-4 text-sm leading-6 text-gray-600">
                                      {fileName}
                                    </p>
                                  ) : (
                                    <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                      {isDragActive
                                        ? "Suelta el archivo aquí..."
                                        : isCompressing
                                        ? "Procesando archivo..."
                                        : "Arrastra y suelta el comprobante aquí o haz click para seleccionarlo"}
                                    </p>
                                  )}
                                  <p className="text-xs leading-5 text-gray-600">
                                    Hasta 10MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones al final */}
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
                        disabled={loading || isCompressing}
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:opacity-50"
                      >
                        {loading || isCompressing ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"
                            viewBox="0 0 24 24"
                          ></svg>
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

export default ExpenseForm;
