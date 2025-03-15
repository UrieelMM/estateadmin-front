import React, { useState, useEffect } from 'react';

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { usePaymentSummaryStore } from '../../../../../store/paymentSummaryStore';
import { formatCurrency } from '../../../../../utils/curreyncy';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import LoadingApp from '../../../../components/shared/loaders/LoadingApp';

interface FilterState {
    month: string;
    year: string;
}

const ITEMS_PER_PAGE = 20;
const MONTHS = [
    { value: '', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
];

const HistoryPaymentsTable: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<FilterState>({
        month: '',
        year: new Date().getFullYear().toString(),
    });
    const [showFilters, setShowFilters] = useState(false);

    const { 
        payments, 
        fetchSummary, 
        loading, 
        setSelectedYear,
        setupRealtimeListeners,
        cleanupListeners
    } = usePaymentSummaryStore((state) => ({
        payments: state.payments,
        fetchSummary: state.fetchSummary,
        loading: state.loading,
        setSelectedYear: state.setSelectedYear,
        setupRealtimeListeners: state.setupRealtimeListeners,
        cleanupListeners: state.cleanupListeners
    }));

    useEffect(() => {
        const loadData = async () => {
            setSelectedYear(filters.year);
            await fetchSummary(filters.year);
            setupRealtimeListeners(filters.year);
        };
        loadData();

        return () => {
            cleanupListeners(filters.year);
        };
    }, [fetchSummary, filters.year, setSelectedYear, setupRealtimeListeners, cleanupListeners]);

    // Filtrar pagos según los criterios seleccionados
    const filteredPayments = payments.filter((payment) => {
        // Filtrar por mes
        if (filters.month && payment.month) {
            if (payment.month !== filters.month) return false;
        }
        
        return true;
    });

    // Calcular la paginación
    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleFilterChange = async (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        
        if (key === 'year') {
            setSelectedYear(value);
            await fetchSummary(value);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingApp />
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                        Historial de Pagos
                    </h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Lista de todos los pagos registrados en el sistema
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Filtros */}
            {showFilters && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="shadow-lg rounded p-4">
                        <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Año
                        </label>
                        <select
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                        >
                            {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="shadow-lg rounded p-4">
                        <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Mes
                        </label>
                        <select
                            value={filters.month}
                            onChange={(e) => handleFilterChange('month', e.target.value)}
                            className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                        >
                            {MONTHS.map((month) => (
                                <option key={month.value} value={month.value}>
                                    {month.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                                            Fecha
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Monto
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Número de Condominio
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Concepto
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Comprobante
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {paginatedPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700 cursor-pointer">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                                                {payment.paymentDate || 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                                {formatCurrency(payment.amountPaid)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                                {payment.numberCondominium}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                                {payment.concept}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-gray-200">
                                                {payment.attachmentPayment ? (
                                                    <a
                                                        href={payment.attachmentPayment}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex w-16 items-center bg-indigo-600 dark:bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                                                    >
                                                        <EyeIcon className="h-5 w-5 mr-1 bg-indigo-500 hover:bg-indigo-600 rounded-full" />
                                                        Ver
                                                    </a>
                                                ) : (
                                                    <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                            <span className="font-medium">
                                {Math.min(startIndex + ITEMS_PER_PAGE, filteredPayments.length)}
                            </span>{' '}
                            de <span className="font-medium">{filteredPayments.length}</span> resultados
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:text-gray-100 dark:hover:bg-indigo-300"
                            >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                            {/* Números de página */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-100'
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0 dark:text-gray-100 dark:hover:bg-indigo-300'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:text-gray-100 dark:hover:bg-indigo-300"
                            >
                                <span className="sr-only">Siguiente</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryPaymentsTable;