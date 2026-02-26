import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  LifebuoyIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import useSuperAdminStore from "../../../store/superAdmin/SuperAdminStore";
import useBillingStore from "../../../store/superAdmin/BillingStore";
import useSupportTicketsAdminStore from "../../../store/superAdmin/SupportTicketsAdminStore";
import useSuperAdminDirectoryStore from "../../../store/superAdmin/SuperAdminDirectoryStore";
import useClientsConfig from "../../../store/superAdmin/useClientsConfig";

interface DashboardStat {
  name: string;
  value: string;
  icon: React.ElementType;
  color: string;
  detail: string;
}

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  date: Date | null;
  typeLabel: string;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toDateLabel = (value: Date | null): string => {
  if (!value) return "-";
  return value.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toStatusLabel = (status?: string): string => {
  switch (status) {
    case "active":
      return "Activo";
    case "inactive":
      return "Inactivo";
    case "pending":
      return "Pendiente";
    case "blocked":
      return "Bloqueado";
    default:
      return "Sin estado";
  }
};

const toInvoiceStatusLabel = (status?: string): string => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagada";
    case "overdue":
      return "Vencida";
    case "canceled":
      return "Cancelada";
    default:
      return "Sin estado";
  }
};

const toTicketStatusLabel = (status?: string): string => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "in_progress":
      return "En proceso";
    case "resolved":
      return "Resuelto";
    default:
      return "Sin estado";
  }
};

const getPrimaryCondominium = (client: any) => {
  if (!Array.isArray(client?.condominiums) || client.condominiums.length === 0) {
    return null;
  }
  return client.condominiums[0];
};

const getClientPlan = (client: any): string => {
  const primaryCondominium = getPrimaryCondominium(client);
  return String(primaryCondominium?.plan || client?.plan || "N/A");
};

const getClientStatus = (client: any): string => {
  const primaryCondominium = getPrimaryCondominium(client);
  return String(primaryCondominium?.status || client?.status || "pending");
};

const getClientCondominiumsCount = (client: any): number => {
  if (Array.isArray(client?.condominiums)) return client.condominiums.length;
  return Number(client?.condominiumsCount || 0);
};

const SuperAdminDashboard: React.FC = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const {
    clients,
    fetchClients,
    loadingClients,
    error: clientsError,
  } = useSuperAdminStore((state) => ({
    clients: state.clients,
    fetchClients: state.fetchClients,
    loadingClients: state.loadingClients,
    error: state.error,
  }));

  const {
    invoices,
    fetchInvoices,
    loadingInvoices,
    error: invoicesError,
  } = useBillingStore((state) => ({
    invoices: state.invoices,
    fetchInvoices: state.fetchInvoices,
    loadingInvoices: state.loadingInvoices,
    error: state.error,
  }));

  const {
    tickets,
    fetchTickets,
    loadingTickets,
    ticketsError,
  } = useSupportTicketsAdminStore((state) => ({
    tickets: state.tickets,
    fetchTickets: state.fetchTickets,
    loadingTickets: state.loading,
    ticketsError: state.error,
  }));

  const {
    condominiumNames,
    fetchDirectory,
    loadingDirectory,
    directoryError,
  } = useSuperAdminDirectoryStore((state) => ({
    condominiumNames: state.condominiumNames,
    fetchDirectory: state.fetchDirectory,
    loadingDirectory: state.loading,
    directoryError: state.error,
  }));

  const { clientsWithCondominiums, fetchClientsWithCondominiums } =
    useClientsConfig((state) => ({
      clientsWithCondominiums: state.clientsWithCondominiums,
      fetchClientsWithCondominiums: state.fetchClientsWithCondominiums,
    }));

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("es-MX").format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const loadDashboardData = async () => {
    setIsBootstrapping(true);
    await Promise.allSettled([
      fetchClients(),
      fetchInvoices(200),
      fetchTickets(),
      fetchDirectory(),
    ]);
    const baseClients = useSuperAdminStore.getState().clients;
    if (baseClients.length > 0) {
      await fetchClientsWithCondominiums(baseClients as any);
    }
    setIsBootstrapping(false);
  };

  useEffect(() => {
    void loadDashboardData();
  }, [
    fetchClients,
    fetchInvoices,
    fetchTickets,
    fetchDirectory,
    fetchClientsWithCondominiums,
  ]);

  const clientsData = useMemo<any[]>(() => {
    return clientsWithCondominiums.length > 0
      ? (clientsWithCondominiums as any[])
      : (clients as any[]);
  }, [clientsWithCondominiums, clients]);

  const stats = useMemo<DashboardStat[]>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const activeClients = clientsData.filter(
      (client) => getClientStatus(client) === "active"
    ).length;

    const createdThisMonth = clientsData.filter((client) => {
      const date = toDate(client.createdDate);
      return (
        date?.getMonth() === currentMonth && date?.getFullYear() === currentYear
      );
    }).length;

    const createdPreviousMonth = clientsData.filter((client) => {
      const date = toDate(client.createdDate);
      return (
        date?.getMonth() === previousMonth &&
        date?.getFullYear() === previousYear
      );
    }).length;

    const clientGrowthDetail =
      createdPreviousMonth > 0
        ? `${(
            ((createdThisMonth - createdPreviousMonth) / createdPreviousMonth) *
            100
          ).toFixed(1)}% vs mes anterior`
        : `${createdThisMonth} nuevos este mes`;

    const totalCondominiums =
      Object.keys(condominiumNames).length ||
      clientsData.reduce(
        (sum, client) => sum + getClientCondominiumsCount(client),
        0
      );

    const clientsWithMaintenanceApp = clientsData.filter(
      (client) => client.hasMaintenanceApp
    ).length;

    const currentMonthBilling = invoices
      .filter((invoice) => {
        const date = toDate(invoice.createdAt);
        return (
          date?.getMonth() === currentMonth && date?.getFullYear() === currentYear
        );
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

    const pendingInvoices = invoices.filter((invoice) =>
      ["pending", "overdue"].includes(invoice.paymentStatus || invoice.status || "")
    );

    const pendingInvoicesAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount || 0),
      0
    );

    const openTickets = tickets.filter(
      (ticket) => ticket.status !== "resolved"
    ).length;
    const highPriorityOpenTickets = tickets.filter(
      (ticket) => ticket.status !== "resolved" && ticket.priority === "high"
    ).length;

    return [
      {
        name: "Clientes activos",
        value: formatNumber(activeClients),
        icon: BuildingOffice2Icon,
        color: "bg-blue-500",
        detail: clientGrowthDetail,
      },
      {
        name: "Condominios registrados",
        value: formatNumber(totalCondominiums),
        icon: UsersIcon,
        color: "bg-emerald-500",
        detail: `${formatNumber(clientsWithMaintenanceApp)} con app de mantenimiento`,
      },
      {
        name: "Facturación del mes",
        value: formatCurrency(currentMonthBilling),
        icon: CreditCardIcon,
        color: "bg-indigo-500",
        detail: `${pendingInvoices.length} facturas pendientes (${formatCurrency(
          pendingInvoicesAmount
        )})`,
      },
      {
        name: "Tickets de soporte abiertos",
        value: formatNumber(openTickets),
        icon: LifebuoyIcon,
        color: "bg-amber-500",
        detail: `${formatNumber(highPriorityOpenTickets)} de alta prioridad`,
      },
    ];
  }, [clientsData, condominiumNames, invoices, tickets]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const clientActivity: ActivityItem[] = clientsData.slice(0, 15).map((client) => ({
      id: `client-${client.id}`,
      title: `Cliente: ${client.companyName || client.businessName || client.email}`,
      detail: `Plan ${getClientPlan(client)} · ${toStatusLabel(getClientStatus(client))}`,
      date: toDate(client.createdDate),
      typeLabel: "Cliente",
    }));

    const invoicesActivity: ActivityItem[] = invoices.slice(0, 25).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: `Factura ${invoice.invoiceNumber || invoice.id}`,
      detail: `${invoice.condominiumName || "Condominio"} · ${formatCurrency(
        Number(invoice.amount || 0)
      )} · ${toInvoiceStatusLabel(invoice.paymentStatus || invoice.status)}`,
      date: toDate(invoice.createdAt),
      typeLabel: "Factura",
    }));

    const ticketsActivity: ActivityItem[] = tickets.slice(0, 25).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      title: `${ticket.ticketNumber} · ${ticket.title}`,
      detail: `${toTicketStatusLabel(ticket.status)} · Prioridad ${ticket.priority}`,
      date: toDate(ticket.createdAt),
      typeLabel: "Soporte",
    }));

    return [...clientActivity, ...invoicesActivity, ...ticketsActivity]
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.getTime() - a.date.getTime();
      })
      .slice(0, 8);
  }, [clientsData, invoices, tickets]);

  const recentClients = useMemo(() => {
    return [...clientsData]
      .sort((a, b) => {
        const dateA = toDate(a.createdDate)?.getTime() || 0;
        const dateB = toDate(b.createdDate)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [clientsData]);

  const isLoading =
    isBootstrapping ||
    (loadingClients && clients.length === 0) ||
    (loadingInvoices && invoices.length === 0) ||
    (loadingTickets && tickets.length === 0) ||
    (loadingDirectory && Object.keys(condominiumNames).length === 0);

  const errors = [
    clientsError,
    invoicesError,
    ticketsError,
    directoryError,
  ].filter(Boolean) as string[];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700" />
                  <div className="ml-5 w-full">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="mt-2 h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
                <div className="mt-4 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Panel de Control Super Admin
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vista global de clientes, facturación y soporte en tiempo real.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          Se cargó el dashboard con datos parciales. Detalle: {errors[0]}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  {stat.detail}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Actividad de la Plataforma
          </h3>
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                No hay actividad reciente disponible.
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.detail}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {activity.typeLabel}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {toDateLabel(activity.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Clientes Recientes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Últimos clientes registrados en la plataforma
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
          {recentClients.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Aún no hay clientes registrados.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Condominios
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Fecha de registro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.companyName || client.businessName || client.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {getClientPlan(client)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {toStatusLabel(getClientStatus(client))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatNumber(getClientCondominiumsCount(client))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {toDateLabel(toDate(client.createdDate))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
