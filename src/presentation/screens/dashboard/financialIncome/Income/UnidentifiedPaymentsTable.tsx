// UnidentifiedPaymentsTable.tsx
import { useEffect, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import ApplyPaymentModal from "./ApplyPaymentModal"; // Asegúrate de tener este componente implementado
import { useUnidentifiedPaymentsStore } from "../../../../../store/useUnidentifiedPaymentsStore";

const UnidentifiedPaymentsTable = () => {
  const {
    payments,
    fetchPayments,
    hasMore,
    openPaymentModal,
    selectedPayment,
    closePaymentModal,
  } = useUnidentifiedPaymentsStore();
  
  // Estados para filtros de mes y año
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);

  // Cargar pagos al montar o al cambiar filtros
  useEffect(() => {
    fetchPayments(filterMonth, filterYear);
  }, [filterMonth, filterYear, fetchPayments]);

  // Función para paginar (cargar siguiente página)
  const handleLoadMore = async () => {
    await fetchPayments(filterMonth, filterYear, true);
  };

  // Formateo de fechas: dd/mm/aaaa
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      {/* Filtros */}
      <div className="mb-4 flex space-x-4">
        <select
          className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          value={filterMonth || ""}
          onChange={(e) =>
            setFilterMonth(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Mes</option>
          {[
            { value: 1, label: "Enero" },
            { value: 2, label: "Febrero" },
            { value: 3, label: "Marzo" },
            { value: 4, label: "Abril" },
            { value: 5, label: "Mayo" },
            { value: 6, label: "Junio" },
            { value: 7, label: "Julio" },
            { value: 8, label: "Agosto" },
            { value: 9, label: "Septiembre" },
            { value: 10, label: "Octubre" },
            { value: 11, label: "Noviembre" },
            { value: 12, label: "Diciembre" },
          ].map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Año"
          className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          value={filterYear || ""}
          onChange={(e) =>
            setFilterYear(e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <button
          onClick={() => fetchPayments(filterMonth, filterYear)}
          className="bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Filtrar
        </button>
      </div>

      {/* Tabla de pagos */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-indigo-600 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Fecha de pago
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Fecha de registro
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Monto abonado
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Comprobante
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Tipo de pago
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-white">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment) => (
              <tr key={payment.id} className="dark:text-gray-100">
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(payment.paymentDate)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(payment.registrationDate)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(payment.amountPaid)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {payment.attachmentPayment ? (
                    <a
                      href={payment.attachmentPayment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline"
                    >
                      Ver
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {payment.paymentType}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <button
                    onClick={() => openPaymentModal(payment)}
                    className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Aplicar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón para paginación */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            Cargar más
          </button>
        </div>
      )}

      {/* Modal para aplicar pago */}
      {selectedPayment && (
        <ApplyPaymentModal 
          amount={selectedPayment.amountPaid}
          open={true}
          setOpen={(open) => { if (!open) closePaymentModal(); }}
        />
      )}
    </div>
  );
};

export default UnidentifiedPaymentsTable;
