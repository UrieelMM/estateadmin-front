import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";
import useSupportTicketsAdminStore from "../../../store/superAdmin/SupportTicketsAdminStore";
import useSuperAdminDirectoryStore from "../../../store/superAdmin/SuperAdminDirectoryStore";

const formatDateTime = (value: any): string => {
  if (!value) return "-";
  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-MX");
};

const toDateInputValue = (value: any): string => {
  if (!value) return "";
  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SupportTicketsManagement: React.FC = () => {
  const { tickets, loading, error, fetchTickets } = useSupportTicketsAdminStore();
  const { clientNames, condominiumNames, fetchDirectory } =
    useSuperAdminDirectoryStore();
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    ok: boolean;
    status: number;
    statusText: string;
    checkedAt: string;
    payload: string;
  } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchTickets();
    fetchDirectory();
  }, [fetchTickets, fetchDirectory]);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return tickets.filter((ticket) => {
      const createdAt =
        typeof ticket.createdAt?.toDate === "function"
          ? ticket.createdAt.toDate()
          : ticket.createdAt
          ? new Date(ticket.createdAt)
          : null;

      if (start && createdAt && createdAt < start) return false;
      if (end && createdAt && createdAt > end) return false;
      if (priorityFilter && ticket.priority !== priorityFilter) return false;
      if (categoryFilter && ticket.issueType !== categoryFilter) return false;

      if (!searchTerm) return true;
      return (
        ticket.ticketNumber?.toLowerCase().includes(searchTerm) ||
        ticket.title?.toLowerCase().includes(searchTerm) ||
        ticket.email?.toLowerCase().includes(searchTerm) ||
        ticket.clientId?.toLowerCase().includes(searchTerm) ||
        ticket.condominiumId?.toLowerCase().includes(searchTerm)
      );
    });
  }, [tickets, search, priorityFilter, categoryFilter, startDate, endDate]);

  useEffect(() => {
    if (tickets.length > 0 && !startDate && !endDate) {
      setStartDate(toDateInputValue(tickets[tickets.length - 1]?.createdAt));
      setEndDate(toDateInputValue(tickets[0]?.createdAt));
    }
  }, [tickets, startDate, endDate]);

  const handleHealthCheck = async () => {
    try {
      setHealthLoading(true);
      setHealthError(null);

      const baseUrl = import.meta.env.VITE_URL_SERVER;
      if (!baseUrl) {
        throw new Error("VITE_URL_SERVER no está configurado.");
      }

      const response = await fetch(`${baseUrl}/health`, {
        method: "GET",
      });

      let payloadText = "";
      try {
        const payload = await response.clone().json();
        payloadText = JSON.stringify(payload, null, 2);
      } catch {
        payloadText = await response.text();
      }

      setHealthStatus({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        checkedAt: new Date().toLocaleString("es-MX"),
        payload: payloadText || "(sin contenido)",
      });
    } catch (error: any) {
      setHealthError(error?.message || "No se pudo consultar /health.");
      setHealthStatus(null);
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Tickets de Soporte
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vista global con filtros por fecha, prioridad y categoria.
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 md:grid-cols-5">
        <label className="relative md:col-span-2">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por folio, titulo, email, clientId..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
        </label>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">Todas las categorias</option>
          <option value="bug">Error tecnico</option>
          <option value="incident">Incidente operativo</option>
          <option value="question">Duda</option>
          <option value="request">Mejora solicitada</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            title="Desde"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            title="Hasta"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Estado del Backend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verifica disponibilidad del endpoint <code>/health</code>.
            </p>
          </div>
          <button
            onClick={handleHealthCheck}
            disabled={healthLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
          >
            <ArrowPathIcon className={`h-4 w-4 ${healthLoading ? "animate-spin" : ""}`} />
            {healthLoading ? "Probando..." : "Probar /health"}
          </button>
        </div>

        {healthError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {healthError}
          </div>
        )}

        {healthStatus && (
          <div className="mt-3 space-y-2">
            <div
              className={`rounded-lg border p-3 text-sm ${
                healthStatus.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
              }`}
            >
              <p>
                Resultado: <strong>{healthStatus.ok ? "Activo" : "Con incidencia"}</strong>
              </p>
              <p>
                HTTP: <strong>{healthStatus.status}</strong> {healthStatus.statusText}
              </p>
              <p>Verificado: {healthStatus.checkedAt}</p>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
              {healthStatus.payload}
            </pre>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Folio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Prioridad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cliente / Condominio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Evidencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {ticket.ticketNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {ticket.issueType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                    {ticket.priority}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ticket.title}
                    </p>
                    <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    <p>
                      cliente:{" "}
                      {clientNames[ticket.clientId] || ticket.clientId}
                    </p>
                    <p>
                      condominio:{" "}
                      {condominiumNames[
                        `${ticket.clientId}__${ticket.condominiumId}`
                      ] || ticket.condominiumId}
                    </p>
                    <p>module: {ticket.module}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1">
                        <PaperClipIcon className="h-4 w-4" />
                        {ticket.attachmentUrls?.length || 0}
                      </span>
                      {ticket.attachmentUrls?.length > 0 && (
                        <a
                          href={ticket.attachmentUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Ver primera imagen
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No hay tickets que coincidan con los filtros.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Cargando tickets de soporte...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsManagement;
