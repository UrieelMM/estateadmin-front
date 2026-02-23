import React, { useState, useEffect } from "react";
import {
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { useChargeStore } from "../../../../../store/useChargeStore";
import useUserStore from "../../../../../store/UserDataStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { toast } from "react-hot-toast";
import { commonConcepts } from "../../../../../utils/commonConcepts";

const getCurrentMonthDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startAt = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dueDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;

  return { startAt, dueDate };
};

const ChargeForm = () => {
  const { createChargeForOne, createChargeForAll, loading, error } =
    useChargeStore();
  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );
  const fetchSummary = usePaymentSummaryStore((state) => state.fetchSummary);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  const [chargeType, setChargeType] = useState<"individual" | "all">(
    "individual"
  );
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [concept, setConcept] = useState<string>("Cuota de mantenimiento");
  const [amount, setAmount] = useState<number>(0);
  const [amountDisplay, setAmountDisplay] = useState<string>("");

  const [_generatedAt] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });
  const [startAt, setStartAt] = useState<string>(
    () => getCurrentMonthDateRange().startAt
  );
  const [dueDate, setDueDate] = useState<string>(
    () => getCurrentMonthDateRange().dueDate
  );
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const validateForm = (): boolean => {
    if (chargeType === "individual" && !selectedUser) {
      toast.error("Debe seleccionar un usuario");
      return false;
    }

    if (!concept) {
      toast.error("El concepto es obligatorio");
      return false;
    }

    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return false;
    }

    if (!startAt) {
      toast.error("La fecha de inicio es obligatoria");
      return false;
    }

    if (!dueDate) {
      toast.error("La fecha límite es obligatoria");
      return false;
    }

    if (startAt && dueDate && new Date(startAt) > new Date(dueDate)) {
      toast.error("La fecha límite debe ser posterior a la fecha de inicio");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formatDateTime = (dateString: string, isDueDate: boolean): string => {
      return `${dateString} ${isDueDate ? "23:59" : "00:00"}`;
    };

    const formattedStartAt = formatDateTime(startAt, false);
    const formattedDueDate = formatDateTime(dueDate, true);

    const options = {
      concept,
      amount,
      startAt: formattedStartAt,
      dueDate: formattedDueDate,
      paid,
    };

    try {
      if (chargeType === "individual") {
        await createChargeForOne(selectedUser, options);
        toast.success("Cargo creado para el usuario seleccionado");
      } else {
        await createChargeForAll(options);
        toast.success("Cargo creado para todos los usuarios");
      }

      await fetchSummary();

      // Resetear el formulario
      const currentMonthRange = getCurrentMonthDateRange();
      setConcept("Cuota de mantenimiento");
      setAmount(0);
      setAmountDisplay("");
      setStartAt(currentMonthRange.startAt);
      setDueDate(currentMonthRange.dueDate);
      setPaid(false);
      setSelectedUser("");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el cargo");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const num = parseFloat(rawValue.replace(/[^0-9.]/g, "")) || 0;
    setAmount(num);
    setAmountDisplay(rawValue);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg dark:bg-gray-800 dark:text-gray-100 transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Asignar Cargo
        </h2>
        <DocumentTextIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
      </div>
      {error && toast.error(error)}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Tipo de cargo:
          </label>
          <div className="flex gap-4">
            <label
              className={`flex items-center p-3 border text-md border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 ${
                chargeType === "individual"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 dark:border-indigo-500"
                  : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-4 h-4 border-2 rounded-full mr-3 ${
                  chargeType === "individual"
                    ? "border-indigo-500 dark:border-indigo-400"
                    : "border-gray-400 dark:border-gray-500"
                }`}
              >
                {chargeType === "individual" && (
                  <div className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                )}
              </div>
              <input
                type="radio"
                value="individual"
                checked={chargeType === "individual"}
                onChange={() => setChargeType("individual")}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-xs">Individual</span>
              </div>
            </label>
            <label
              className={`flex items-center p-3 border text-md border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 ${
                chargeType === "all"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-gray-700 dark:border-indigo-500"
                  : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-4 h-4 border-2 rounded-full mr-3 ${
                  chargeType === "all"
                    ? "border-indigo-500 dark:border-indigo-400"
                    : "border-gray-400 dark:border-gray-500"
                }`}
              >
                {chargeType === "all" && (
                  <div className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                )}
              </div>
              <input
                type="radio"
                value="all"
                checked={chargeType === "all"}
                onChange={() => setChargeType("all")}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium text-xs">
                  Todos los condóminos
                </span>
              </div>
            </label>
          </div>
        </div>

        {chargeType === "individual" && (
          <div className="mb-4 animate-fadeIn">
            <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Usuario (condómino):
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 flex items-center transform -translate-y-1/2 z-10 transition-all group-focus-within:text-indigo-500">
                <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
              </div>
              <select
                className="w-full pl-10 h-[46px] border border-gray-200 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm pr-10"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236366F1%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "20px",
                }}
              >
                <option value="" className="text-gray-500">
                  -- Selecciona un usuario --
                </option>
                {condominiumsUsers
                  .filter(
                    (user) =>
                      user.role !== "admin" &&
                      user.role !== "super-admin" &&
                      user.role !== "security"
                  )
                  .map((user) => (
                    <option key={user.uid} value={user.uid} className="py-2">
                      {user.number} {user.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Concepto:
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 flex items-center transform -translate-y-1/2 z-10 transition-all group-focus-within:text-indigo-500">
              <ClipboardIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <select
              className="w-full pl-10 h-[46px] border border-gray-200 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm pr-10"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              style={{
                backgroundImage:
                  "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236366F1%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "20px",
              }}
            >
              {commonConcepts.map((item) => (
                <option key={item} value={item} className="py-2">
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Monto:
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 flex items-center transform -translate-y-1/2 z-10 transition-all group-focus-within:text-indigo-500">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <input
              type="text"
              className="w-full pl-10 h-[46px] border border-gray-200 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
              value={amountDisplay}
              onChange={handleAmountChange}
              onFocus={() => setAmountDisplay(amount.toString())}
              onBlur={() => {
                if (amount > 0) {
                  setAmountDisplay(formatCurrency(amount));
                } else {
                  setAmountDisplay("");
                }
              }}
              placeholder="Ejemplo: $1500"
              min="0"
            />
            {amount > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-gray-700 px-2 py-1 rounded-full">
                {formatCurrency(amount)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Fecha de inicio del cargo:
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 flex items-center transform -translate-y-1/2 z-10 transition-all group-focus-within:text-indigo-500">
              <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <input
              type="date"
              className="w-full pl-10 h-[46px] border border-gray-200 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm cursor-pointer"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Fecha límite de pago:
          </label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 flex items-center transform -translate-y-1/2 z-10 transition-all group-focus-within:text-indigo-500">
              <CalendarIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <input
              type="date"
              className="w-full pl-10 h-[46px] border border-gray-200 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm cursor-pointer"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Estado de pago:
          </label>
          <label className="relative inline-flex items-center cursor-pointer p-3 border border-gray-200 dark:border-gray-600 rounded-lg transition-all hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`relative w-12 h-6 flex items-center rounded-full transition duration-300 ease-in-out px-0.5 ${
                paid ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${
                  paid ? "translate-x-6" : "translate-x-0"
                }`}
              ></div>
            </div>
            <div className="flex items-center ml-3">
              {paid ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Pagado
                  </span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Pendiente
                  </span>
                </>
              )}
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
            disabled={loading}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Guardar Cargo</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChargeForm;
