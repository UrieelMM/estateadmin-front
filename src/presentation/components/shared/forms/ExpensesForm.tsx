import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Transition, Dialog, Combobox } from "@headlessui/react";
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ClipboardIcon,
  CreditCardIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  BuildingLibraryIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import {
  CheckIcon,
  ChevronUpDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
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

const normalizeAccountName = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const inputBase =
  "block w-full rounded-lg border-0 bg-white py-2 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500";

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  description,
  icon,
  children,
}: SectionCardProps) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <header className="flex items-start gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </header>
    <div className="space-y-4 px-4 py-4">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}

const Field = ({
  label,
  htmlFor,
  hint,
  optional,
  children,
}: FieldProps) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
    >
      {label}
      {optional && (
        <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-gray-400">
          (opcional)
        </span>
      )}
    </label>
    <div className="mt-1.5">{children}</div>
    {hint && (
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    )}
  </div>
);

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

  const selectableFinancialAccounts = useMemo(
    () =>
      financialAccounts.filter((account) => {
        const normalized = normalizeAccountName(account.name);
        return !normalized.includes("cajachica");
      }),
    [financialAccounts]
  );

  const getProviderLabel = (id: string) => {
    if (!id) return "";
    const provider = providers.find((item) => item.id === id);
    return provider
      ? `${provider.name} - ${provider.serviceLabel}`
      : "Proveedor no disponible";
  };

  const summaryAccountName = useMemo(
    () =>
      selectableFinancialAccounts.find((acc) => acc.id === financialAccountId)
        ?.name || "",
    [selectableFinancialAccounts, financialAccountId],
  );

  const formattedExpenseDate = useMemo(() => {
    if (!expenseDate) return "";
    const parsed = new Date(expenseDate);
    if (isNaN(parsed.getTime())) return expenseDate;
    return parsed.toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [expenseDate]);

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
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity" />
        </Transition.Child>
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
                <Dialog.Panel className="pointer-events-auto flex h-full w-screen max-w-3xl flex-col">
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full min-h-0 flex-col bg-gray-50 shadow-2xl dark:bg-gray-950"
                  >
                    {/* Hero header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-5 sm:px-6 dark:from-indigo-700 dark:via-indigo-800 dark:to-violet-900">
                      <button
                        type="button"
                        className="absolute right-4 top-4 inline-flex items-center justify-center rounded-lg bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        onClick={() => setOpen(false)}
                        aria-label="Cerrar"
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <div className="flex items-center gap-3 pr-10">
                        <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur">
                          <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <Dialog.Title className="text-lg font-bold leading-tight text-white">
                            Registrar egreso
                          </Dialog.Title>
                          <p className="mt-0.5 text-xs text-indigo-100">
                            Registra un gasto del condominio con concepto, cuenta y
                            comprobante opcional.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-0 flex-1 overflow-y-auto">
                      <div className="space-y-4 px-4 py-5 sm:px-6">
                        <SectionCard
                          title="Detalle del egreso"
                          description="Monto, fecha y forma de pago."
                          icon={<CurrencyDollarIcon className="h-4 w-4" />}
                        >
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Monto del egreso" htmlFor="amount">
                              <div className="relative">
                                <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  id="amount"
                                  name="amount"
                                  type="text"
                                  className={`${inputBase} pl-9 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
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
                            </Field>

                            <Field label="Fecha del egreso" htmlFor="expenseDate">
                              <div className="relative">
                                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  id="expenseDate"
                                  name="expenseDate"
                                  type="datetime-local"
                                  className={`${inputBase} pl-9`}
                                  value={expenseDate}
                                  onChange={(e) => setExpenseDate(e.target.value)}
                                />
                              </div>
                            </Field>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Tipo de pago" htmlFor="paymentType">
                              <div className="relative">
                                <CreditCardIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <select
                                  id="paymentType"
                                  name="paymentType"
                                  className={`${inputBase} pl-9`}
                                  value={paymentType}
                                  onChange={(e) => setPaymentType(e.target.value)}
                                >
                                  <option value="">Selecciona…</option>
                                  {PAYMENT_TYPES.map((pt) => (
                                    <option key={pt} value={pt}>
                                      {pt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </Field>

                            <Field label="Cuenta financiera" htmlFor="financialAccountId">
                              <div className="relative">
                                <BuildingLibraryIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <select
                                  id="financialAccountId"
                                  name="financialAccountId"
                                  value={financialAccountId}
                                  onChange={(e) =>
                                    setFinancialAccountId(e.target.value)
                                  }
                                  className={`${inputBase} pl-9`}
                                  required
                                >
                                  <option value="">Selecciona una cuenta</option>
                                  {selectableFinancialAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </Field>
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Clasificación"
                          description="Proveedor y concepto del gasto."
                          icon={<TagIcon className="h-4 w-4" />}
                        >
                          <Field
                            label="Proveedor"
                            htmlFor="providerId"
                            optional
                            hint="Busca por nombre o tipo de servicio."
                          >
                            <Combobox
                              value={providerId}
                              onChange={(value: string) => {
                                setProviderId(value);
                                setProviderSearch("");
                              }}
                            >
                              <div className="relative">
                                <UserGroupIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Combobox.Input
                                  id="providerId"
                                  name="providerId"
                                  className={`${inputBase} pl-9 pr-10`}
                                  displayValue={(id: string) => getProviderLabel(id)}
                                  onChange={(event) =>
                                    setProviderSearch(event.target.value)
                                  }
                                  onFocus={() =>
                                    providerComboboxButtonRef.current?.click()
                                  }
                                  placeholder="Buscar proveedor"
                                />
                                <Combobox.Button
                                  ref={providerComboboxButtonRef}
                                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                                >
                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </Combobox.Button>
                              </div>
                              <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/[0.08]">
                                <Combobox.Option
                                  value=""
                                  className={({ active }) =>
                                    cn(
                                      "relative cursor-default select-none px-3 py-1.5 text-[11px] italic",
                                      active
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-gray-500 dark:text-gray-400",
                                    )
                                  }
                                >
                                  Sin proveedor
                                </Combobox.Option>
                                {filteredProviders.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    Sin resultados
                                  </div>
                                ) : (
                                  filteredProviders.map((provider) => (
                                    <Combobox.Option
                                      key={provider.id}
                                      value={provider.id}
                                      className={({ active }) =>
                                        cn(
                                          "relative cursor-default select-none px-2 py-1.5",
                                          active && "bg-indigo-50 dark:bg-indigo-500/10",
                                        )
                                      }
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={cn(
                                              "truncate text-sm font-semibold",
                                              providerId === provider.id
                                                ? "text-indigo-700 dark:text-indigo-300"
                                                : "text-gray-900 dark:text-gray-100",
                                            )}
                                          >
                                            {provider.name}
                                          </p>
                                          <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                                            {provider.serviceLabel}
                                          </p>
                                        </div>
                                        {providerId === provider.id && (
                                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                        )}
                                      </div>
                                    </Combobox.Option>
                                  ))
                                )}
                              </Combobox.Options>
                            </Combobox>
                          </Field>

                          {providerId && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                              <span className="font-semibold">Proveedor:</span>{" "}
                              {getProviderLabel(providerId)}
                            </div>
                          )}

                          <Field
                            label="Concepto de egreso"
                            htmlFor="concept"
                            hint="Selecciona o busca entre los conceptos predefinidos."
                          >
                            <Combobox
                              value={concept}
                              onChange={(value: string) => {
                                setConcept(value);
                                setConceptSearch("");
                              }}
                            >
                              <div className="relative">
                                <ClipboardIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Combobox.Input
                                  id="concept"
                                  name="concept"
                                  className={`${inputBase} pl-9 pr-10`}
                                  displayValue={(value: string) => value}
                                  onChange={(event) =>
                                    setConceptSearch(event.target.value)
                                  }
                                  onFocus={() =>
                                    conceptComboboxButtonRef.current?.click()
                                  }
                                  placeholder="Buscar concepto"
                                />
                                <Combobox.Button
                                  ref={conceptComboboxButtonRef}
                                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                                >
                                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                </Combobox.Button>
                              </div>
                              <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/[0.08]">
                                <Combobox.Option
                                  value=""
                                  className={({ active }) =>
                                    cn(
                                      "relative cursor-default select-none px-3 py-1.5 text-[11px] italic",
                                      active
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                        : "text-gray-500 dark:text-gray-400",
                                    )
                                  }
                                >
                                  Sin concepto
                                </Combobox.Option>
                                {filteredExpenseConcepts.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    Sin resultados
                                  </div>
                                ) : (
                                  filteredExpenseConcepts.map((expenseConcept) => (
                                    <Combobox.Option
                                      key={expenseConcept}
                                      value={expenseConcept}
                                      className={({ active }) =>
                                        cn(
                                          "relative cursor-default select-none px-2 py-1.5",
                                          active && "bg-indigo-50 dark:bg-indigo-500/10",
                                        )
                                      }
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span
                                          className={cn(
                                            "truncate text-sm",
                                            concept === expenseConcept
                                              ? "font-semibold text-indigo-700 dark:text-indigo-300"
                                              : "text-gray-900 dark:text-gray-100",
                                          )}
                                        >
                                          {expenseConcept}
                                        </span>
                                        {concept === expenseConcept && (
                                          <CheckIcon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                                        )}
                                      </div>
                                    </Combobox.Option>
                                  ))
                                )}
                              </Combobox.Options>
                            </Combobox>
                          </Field>
                        </SectionCard>

                        <SectionCard
                          title="Comprobante y notas"
                          description="Adjunta factura o recibo y agrega detalles adicionales."
                          icon={<DocumentTextIcon className="h-4 w-4" />}
                        >
                          <Field
                            label="Factura o comprobante"
                            optional
                            hint="PDF o imagen. Se procesa automáticamente. Hasta 10 MB."
                          >
                            <div
                              {...getRootProps()}
                              className={cn(
                                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition",
                                isDragActive
                                  ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
                                  : fileName
                                    ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-900/10"
                                    : "border-gray-300 bg-gray-50/60 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10",
                              )}
                            >
                              <input {...getInputProps()} />
                              <div
                                className={cn(
                                  "mb-2 rounded-full p-2.5",
                                  fileName
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
                                )}
                              >
                                {fileName ? (
                                  <CheckCircleIcon className="h-6 w-6" />
                                ) : (
                                  <CloudArrowUpIcon className="h-6 w-6" />
                                )}
                              </div>
                              {fileName ? (
                                <>
                                  <p className="max-w-full truncate px-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    {fileName}
                                  </p>
                                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    Haz click o arrastra otro archivo para reemplazarlo.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {isDragActive
                                      ? "Suelta el archivo aquí…"
                                      : isCompressing
                                        ? "Procesando archivo…"
                                        : "Arrastra y suelta o haz click"}
                                  </p>
                                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                    PDF, JPG o PNG
                                  </p>
                                </>
                              )}
                            </div>
                          </Field>

                          <Field label="Descripción" htmlFor="description" optional>
                            <textarea
                              id="description"
                              name="description"
                              rows={3}
                              className={`${inputBase} resize-none px-3 py-2`}
                              placeholder="Detalles adicionales del egreso…"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </Field>
                        </SectionCard>
                      </div>
                    </div>

                    {/* Sticky footer */}
                    <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
                      <div className="hidden min-w-0 sm:block">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {amountDisplay ? (
                            <>
                              Egreso de{" "}
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {amountDisplay}
                              </span>
                              {concept && (
                                <>
                                  <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                                    ·
                                  </span>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {concept}
                                  </span>
                                </>
                              )}
                              {summaryAccountName && (
                                <>
                                  <span className="mx-1.5 text-gray-300 dark:text-gray-700">
                                    ·
                                  </span>
                                  {summaryAccountName}
                                </>
                              )}
                            </>
                          ) : (
                            "Revisa los datos antes de guardar."
                          )}
                        </p>
                        {formattedExpenseDate && (
                          <p className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500">
                            {formattedExpenseDate}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                        <button
                          type="button"
                          className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-gray-700"
                          onClick={() => setOpen(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading || isCompressing}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                  stroke="currentColor"
                                  strokeOpacity="0.25"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M21 12a9 9 0 0 1-9 9"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Guardando…
                            </>
                          ) : isCompressing ? (
                            "Procesando archivo…"
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Guardar egreso
                            </>
                          )}
                        </button>
                      </div>
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
