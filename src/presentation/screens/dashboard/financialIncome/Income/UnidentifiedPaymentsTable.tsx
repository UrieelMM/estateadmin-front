// UnidentifiedPaymentsTable.tsx
import { useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
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

    // Estados para filtros de mes, año y aplicado
    const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);
    const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
    const [filterApplied, setFilterApplied] = useState<string>("todos");

    // Cargar pagos inicialmente (sin filtros)
    useEffect(() => {
        fetchPayments(undefined, undefined);
    }, [fetchPayments]);

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

    // Funciones para manejar cambios en los selects de mes y año
    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const month = e.target.value ? Number(e.target.value) : undefined;
        setFilterMonth(month);
        fetchPayments(month, filterYear);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = e.target.value ? Number(e.target.value) : undefined;
        setFilterYear(year);
        fetchPayments(filterMonth, year);
    };

    // Filtrar pagos según el estado aplicado (appliedToUser)
    const filteredPayments = payments.filter((payment) => {
        if (filterApplied === "todos") return true;
        return filterApplied === "aplicado" ? payment.appliedToUser : !payment.appliedToUser;
    });

    return (
        <div className="p-4 bg-white dark:bg-gray-900">
            {/* Filtros */}
            <div className="mb-4 flex space-x-4">
                <select
                    className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    value={filterMonth || ""}
                    onChange={handleMonthChange}
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
                <select
                    className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    value={filterYear || ""}
                    onChange={handleYearChange}
                >
                    <option value="">Año</option>
                    {Array.from({ length: 11 }, (_, i) => 2022 + i).map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                {/* Nuevo filtro para aplicado */}
                <select
                    className="border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    value={filterApplied}
                    onChange={(e) => setFilterApplied(e.target.value)}
                >
                    <option value="todos">Todos</option>
                    <option value="aplicado">Aplicados</option>
                    <option value="no_aplicado">No Aplicados</option>
                </select>
            </div>

            {/* Tabla de pagos */}
            <div className="overflow-x-auto overflow-y-hidden ">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 ">
                    <thead className="bg-indigo-600 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Fecha de pago
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Fecha de registro
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Monto abonado
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Comprobante
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Tipo de pago
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Aplicado
                            </th>
                            <th className="px-4 py-2 text-center text-sm font-medium text-white">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPayments.map((payment) => (
                            <tr key={payment.id} className="dark:text-gray-100">
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                    {formatDate(payment.paymentDate)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                    {formatDate(payment.registrationDate)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                    {new Intl.NumberFormat("es-MX", {
                                        style: "currency",
                                        currency: "MXN",
                                    }).format(payment.amountPaid)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex justify-center items-center w-full">
                                        {payment.attachmentPayment ? (
                                            <a
                                                href={payment.attachmentPayment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                            >
                                                <EyeIcon className="h-5 w-5 mr-1 bg-indigo-500 hover:bg-indigo-600 rounded-full" />
                                                Ver
                                            </a>
                                        ) : (
                                            <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-center">
                                    {payment.paymentType}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex justify-center items-center w-full">
                                        {payment.appliedToUser ? (
                                            <CheckCircleIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        ) : (
                                            <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="flex justify-center items-center w-full">
                                        {!payment.appliedToUser && (
                                            <button
                                                onClick={() => openPaymentModal(payment)}
                                                className="flex items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                            >
                                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                                Aplicar
                                            </button>
                                        )}
                                    </div>
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

            {selectedPayment && (
                <ApplyPaymentModal
                    amount={selectedPayment.amountPaid}
                    paymentDate={selectedPayment.paymentDate}
                    paymentId={selectedPayment.id}
                    paymentType={selectedPayment.paymentType} // Se pasa el tipo de pago, que no deberá poder modificarse
                    financialAccountId={selectedPayment.financialAccountId!} // Se pasa la cuenta donde se asigna el pago
                    attachmentPayment={selectedPayment.attachmentPayment}
                    open={true}
                    setOpen={(open) => { if (!open) closePaymentModal(); }}
                />
            )}
        </div>
    );
};

export default UnidentifiedPaymentsTable;
