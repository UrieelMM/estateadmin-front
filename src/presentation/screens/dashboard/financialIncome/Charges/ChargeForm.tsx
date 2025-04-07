import React, { useState, useEffect } from "react";
import {
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardIcon,
} from "@heroicons/react/16/solid";
import { useChargeStore } from "../../../../../store/useChargeStore";
import useUserStore from "../../../../../store/UserDataStore";
import { usePaymentSummaryStore } from "../../../../../store/paymentSummaryStore";
import { toast } from "react-hot-toast";
import { commonConcepts } from "../../../../../utils/commonConcepts";

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
  const [startAt, setStartAt] = useState<string>("2025-02-01");
  const [dueDate, setDueDate] = useState<string>("2025-02-28");
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
      setConcept("Cuota de mantenimiento");
      setAmount(0);
      setAmountDisplay("");
      setStartAt("2025-02-01");
      setDueDate("2025-02-28");
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
    <div className="bg-white p-4 rounded shadow-md dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-xl font-bold mb-4">Asignar Cargo</h2>
      {error && toast.error(error)}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="font-semibold block mb-1">Tipo de cargo:</label>
          <div>
            <label className="mr-4">
              <input
                type="radio"
                value="individual"
                checked={chargeType === "individual"}
                onChange={() => setChargeType("individual")}
              />
              <span className="ml-1">Individual</span>
            </label>
            <label>
              <input
                type="radio"
                value="all"
                checked={chargeType === "all"}
                onChange={() => setChargeType("all")}
              />
              <span className="ml-1">Todos los condóminos</span>
            </label>
          </div>
        </div>

        {chargeType === "individual" && (
          <div className="mb-4">
            <label className="font-semibold block mb-1">
              Usuario (condómino):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">-- Selecciona un usuario --</option>
                {condominiumsUsers
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
        )}

        <div className="mb-4">
          <label className="font-semibold block mb-1">Concepto:</label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
              <ClipboardIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            >
              {commonConcepts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">Monto:</label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
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
          </div>
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">
            Fecha de inicio del cargo:
          </label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">
            Fecha límite de pago:
          </label>
          <div className="relative">
            <div className="absolute left-2 top-1/2 flex items-center transform -translate-y-1/2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              className="w-full pl-10 h-[42px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">¿Está pagado?:</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
            />
            <span className="ml-1">Pagado</span>
            <CheckCircleIcon className="h-5 w-5 text-gray-400 ml-2" />
          </div>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 px-4 rounded mt-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cargo"}
        </button>
      </form>
    </div>
  );
};

export default ChargeForm;
