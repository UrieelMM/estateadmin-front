import { useEffect, useMemo } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAuditTrailStore } from "../../../../store/useAuditTrailStore";

function formatDate(value: Date | null) {
  return value ? value.toLocaleString("es-MX") : "-";
}

const AuditTrail = () => {
  const {
    loading,
    error,
    logs,
    filters,
    filteredLogs,
    totalItems,
    page,
    totalPages,
    fetchLogs,
    setFilters,
    setPage,
    exportCsv,
  } = useAuditTrailStore();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const moduleOptions = useMemo(() => {
    const values = new Set(logs.map((item) => item.module).filter(Boolean));
    return Array.from(values).sort();
  }, [logs]);

  const actionOptions = useMemo(() => {
    const values = new Set(logs.map((item) => item.action).filter(Boolean));
    return Array.from(values).sort();
  }, [logs]);

  const downloadCsv = () => {
    const csv = exportCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Bitácora de Auditoría
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Registro de acciones críticas con usuario, fecha y contexto.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fetchLogs()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Recargar
            </button>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <select
            value={filters.module}
            onChange={(e) => setFilters({ module: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Todos los módulos</option>
            {moduleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ action: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Todas las acciones</option>
            {actionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Buscar por resumen, entidad o usuario"
            className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Módulo
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Acción
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Entidad
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Resumen
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {loading ? "Cargando auditoría..." : "Sin eventos para mostrar."}
                  </td>
                </tr>
              )}
              {filteredLogs.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/20">
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {item.module}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {item.action}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-200">
                    <p>{item.entityType}</p>
                    <p className="text-gray-500 dark:text-gray-400">{item.entityId || "-"}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {item.summary}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-200">
                    <p>{item.userName || "-"}</p>
                    <p className="text-gray-500 dark:text-gray-400">{item.userEmail || "-"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalItems} resultado(s)</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default AuditTrail;
