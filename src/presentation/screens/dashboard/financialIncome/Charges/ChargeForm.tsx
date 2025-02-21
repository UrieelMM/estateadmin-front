import React, { useState, useEffect } from "react";
import { useChargeStore } from "../../../../../store/useChargeStore";
import useUserStore from "../../../../../store/UserDataStore";

const commonConcepts = [
  "Cuota de mantenimiento",
  "Cuota extraordinaria",
  "Seguridad",
  "Electricidad",
  "Limpieza",
  "Intereses por morosidad",
  "Uso de áreas comunes",
  "Agua",
  "Gas",
  "Fondo de reserva",
  "Reparaciones menores",
  "Recargos",
  "Alumbrado",
  "Convivencia",
  "Multa por ruido",
  "Multa por estacionamiento",
  "Mantenimiento de elevadores",
  "Cuota por mascotas",
  "Servicio de jardinería",
  "Pintura de áreas comunes",
];

const ChargeForm = () => {
  const { createChargeForOne, createChargeForAll, loading, error } = useChargeStore();
  const fetchCondominiumsUsers = useUserStore((state) => state.fetchCondominiumsUsers);
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);

  const [chargeType, setChargeType] = useState<"individual" | "all">("individual");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [concept, setConcept] = useState<string>("Cuota de mantenimiento");
  const [amount, setAmount] = useState<number>(0);
  const [generatedAt] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  });
  const [startAt, setStartAt] = useState<string>("2025-02-01T00:00");
  const [dueDate, setDueDate] = useState<string>("2025-02-28T23:59");
  const [paid, setPaid] = useState<boolean>(false);

  useEffect(() => {
    fetchCondominiumsUsers();
  }, [fetchCondominiumsUsers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formattedStartAt = startAt.replace("T", " ");
    const formattedDueDate = dueDate.replace("T", " ");

    const options = {
      concept,
      amount,
      startAt: formattedStartAt,
      dueDate: formattedDueDate,
      paid,
    };

    try {
      if (chargeType === "individual") {
        if (!selectedUser) {
          alert("Selecciona un usuario para asignar el cargo.");
          return;
        }
        await createChargeForOne(selectedUser, options);
        alert("Cargo creado para el usuario seleccionado.");
      } else {
        await createChargeForAll(options);
        alert("Cargo creado para todos los usuarios.");
      }
      setConcept("Cuota de mantenimiento");
      setAmount(0);
      setStartAt("2025-02-01T00:00");
      setDueDate("2025-02-28T23:59");
      setPaid(false);
      setSelectedUser("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount(0);
    } else {
      setAmount(Number(value));
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Asignar Cargo</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
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
            <label className="font-semibold block mb-1">Usuario (condómino):</label>
            <select
              className="border rounded p-1 w-full"
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
        )}

        <div className="mb-4">
          <label className="font-semibold block mb-1">Concepto:</label>
          <select
            className="border rounded p-1 w-full"
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

        <div className="mb-4">
          <label className="font-semibold block mb-1">Monto:</label>
          <div className="relative">
            <span className="absolute left-2 top-1">$</span>
            <input
              type="number"
              className="border rounded p-1 w-full pl-5"
              value={amount === 0 ? "" : amount}
              onChange={handleAmountChange}
              placeholder="Ejemplo: $1500"
              min="0"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">Fecha y hora de inicio del cargo:</label>
          <input
            type="datetime-local"
            className="border rounded p-1 w-full"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">Fecha y hora límite de pago:</label>
          <input
            type="datetime-local"
            className="border rounded p-1 w-full"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="font-semibold block mb-1">¿Está pagado?:</label>
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
          />
          <span className="ml-1">Pagado</span>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white py-2 px-4 rounded mt-2"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Cargo"}
        </button>
      </form>
    </div>
  );
};

export default ChargeForm;
