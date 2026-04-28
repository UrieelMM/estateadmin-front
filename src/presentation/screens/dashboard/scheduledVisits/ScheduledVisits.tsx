import { Fragment, useEffect, useMemo, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import {
  ScheduledVisit,
  StatusFilter,
  TypeFilter,
  getCheckInAt,
  nextOccurrenceLabel,
  statusBadgeClasses,
  statusLabel,
  toDate,
  useScheduledVisitsStore,
  visitTypeLabel,
} from "../../../../store/useScheduledVisitsStore";
import { useCasetaPinStore } from "../../../../store/useCasetaPinStore";
import ScheduledVisitDetailModal from "./ScheduledVisitDetailModal";
import CasetaPinModal from "./CasetaPinModal";

moment.locale("es");

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activas" },
  { value: "used", label: "En curso" },
  { value: "completed", label: "Completadas" },
  { value: "expired", label: "Expiradas" },
  { value: "cancelled", label: "Canceladas" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "single", label: "Única" },
  { value: "recurring", label: "Recurrente" },
];

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const ScheduledVisits = () => {
  const { visits, isLoading, error, filters, fetchVisits, setFilters } =
    useScheduledVisitsStore();
  const { status: pinStatus, fetchStatus: fetchPinStatus } =
    useCasetaPinStore();

  const [selected, setSelected] = useState<ScheduledVisit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchPinStatus();
  }, [fetchVisits, fetchPinStatus]);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (filters.status !== "all" && v.status !== filters.status) return false;
      if (filters.type !== "all" && v.visitType !== filters.type) return false;

      if (filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        const residentName =
          [v.resident?.name, v.resident?.lastName].filter(Boolean).join(" ") ||
          "";
        const matches =
          v.visitorName?.toLowerCase().includes(s) ||
          residentName.toLowerCase().includes(s) ||
          v.resident?.email?.toLowerCase().includes(s) ||
          v.resident?.departmentNumber?.toLowerCase().includes(s) ||
          v.resident?.phoneNumber?.toLowerCase().includes(s) ||
          v.qrId?.toLowerCase().includes(s);
        if (!matches) return false;
      }

      const arrival = toDate(v.arrivalAt);
      if (filters.dateFrom && arrival) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        if (arrival < from) return false;
      }
      if (filters.dateTo && arrival) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (arrival > to) return false;
      }

      return true;
    });
  }, [visits, filters]);

  const totals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let active = 0;
    let todayCount = 0;
    let recurring = 0;

    for (const v of visits) {
      if (v.status === "active") active++;
      if (v.visitType === "recurring") recurring++;
      const arrival = toDate(v.arrivalAt);
      if (arrival && arrival >= today && arrival < tomorrow) todayCount++;
    }
    return { active, todayCount, recurring, total: visits.length };
  }, [visits]);

  const handleViewDetails = (v: ScheduledVisit) => {
    setSelected(v);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="min-h-full bg-white dark:bg-gray-900 rounded-lg shadow">
        {/* Header */}
        <header className="bg-white shadow-sm dark:bg-gray-800 rounded-t-lg">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                  Visitas agendadas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Visitas creadas por los residentes desde el chatbot de
                  WhatsApp.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(true)}
                  className={classNames(
                    "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset",
                    pinStatus?.configured
                      ? "bg-green-50 text-green-700 ring-green-600/20 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-500/30"
                      : "bg-amber-50 text-amber-800 ring-amber-600/30 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-500/30",
                  )}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  {pinStatus?.configured ? "PIN configurado" : "Configurar PIN"}
                </button>
                <button
                  type="button"
                  onClick={() => fetchVisits()}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <ArrowPathIcon
                    className={classNames(
                      "h-4 w-4 mr-1",
                      isLoading && "animate-spin",
                    )}
                  />
                  Refrescar
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 lg:px-8 pt-4">
          <SummaryCard
            label="Total"
            value={totals.total}
            color="indigo"
            icon={<CalendarDaysIcon className="h-5 w-5" />}
          />
          <SummaryCard
            label="Activas"
            value={totals.active}
            color="green"
            icon={<UserIcon className="h-5 w-5" />}
          />
          <SummaryCard
            label="Hoy"
            value={totals.todayCount}
            color="blue"
            icon={<CalendarDaysIcon className="h-5 w-5" />}
          />
          <SummaryCard
            label="Recurrentes"
            value={totals.recurring}
            color="purple"
            icon={<ArrowPathIcon className="h-5 w-5" />}
          />
        </div>

        {/* Filtros */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                placeholder="Buscar por visitante, residente, depto, teléfono..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterMenu
                label="Estado"
                value={filters.status}
                options={STATUS_OPTIONS}
                onChange={(v) => setFilters({ status: v as StatusFilter })}
              />
              <FilterMenu
                label="Tipo"
                value={filters.type}
                options={TYPE_OPTIONS}
                onChange={(v) => setFilters({ type: v as TypeFilter })}
              />
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    setFilters({ dateFrom: e.target.value || null })
                  }
                  className="rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                />
                <span className="text-gray-400 text-xs">→</span>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    setFilters({ dateTo: e.target.value || null })
                  }
                  className="rounded-md border-0 py-1.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla / contenido */}
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 pb-6">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="flex items-center">
                  <svg
                    className="animate-spin h-8 w-8 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-300">
                    Cargando visitas...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
                <button
                  onClick={() => fetchVisits()}
                  className="mt-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No hay visitas
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {visits.length === 0
                    ? "Aún no se ha agendado ninguna visita en este condominio."
                    : "No hay resultados con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8 mt-4">
                <div className="inline-block min-w-full py-2 align-middle">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <Th>Visitante</Th>
                        <Th>Residente / Depto</Th>
                        <Th>Tipo</Th>
                        <Th>Llegada / Horario</Th>
                        <Th>Estado</Th>
                        <Th>Último registro</Th>
                        <Th className="text-right pr-6">Acciones</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      <AnimatePresence>
                        {filteredVisits.map((v) => (
                          <motion.tr
                            key={v.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => handleViewDetails(v)}
                          >
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 lg:pl-8">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {v.visitorName || "—"}
                              </div>
                              {v.visitorVehicle?.plates && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Vehículo: {v.visitorVehicle.plates}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                              <div>
                                {[v.resident?.name, v.resident?.lastName]
                                  .filter(Boolean)
                                  .join(" ") || v.resident?.email}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {v.resident?.tower
                                  ? `Torre ${v.resident.tower} · `
                                  : ""}
                                Depto {v.resident?.departmentNumber || "—"}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/30 px-2 py-0.5 text-xs font-medium">
                                {visitTypeLabel(v.visitType)}
                              </span>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[280px]">
                              <div className="truncate">
                                {nextOccurrenceLabel(v)}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span
                                className={classNames(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                  statusBadgeClasses(v.status),
                                )}
                              >
                                {statusLabel(v.status)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                const last = toDate(getCheckInAt(v));
                                return last
                                  ? moment(last).format("D MMM, HH:mm")
                                  : "—";
                              })()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(v);
                                }}
                                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                              >
                                <EyeIcon className="mr-1 h-4 w-4" />
                                Ver
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduledVisitDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        visit={selected}
      />
      <CasetaPinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
      />
    </>
  );
};

const Th = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    scope="col"
    className={classNames(
      "py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200",
      className,
    )}
  >
    {children}
  </th>
);

interface FilterMenuProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

const FilterMenu = ({ label, value, options, onChange }: FilterMenuProps) => {
  const current = options.find((o) => o.value === value);
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600">
        <FunnelIcon className="h-5 w-5 mr-1 text-gray-400" />
        {label}: {current?.label || "—"}
        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
          <div className="py-1">
            {options.map((o) => (
              <Menu.Item key={o.value}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(o.value)}
                    className={classNames(
                      active
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-700 dark:text-gray-200",
                      "flex items-center px-4 py-2 text-sm w-full",
                    )}
                  >
                    {value === o.value && (
                      <CheckIcon className="h-4 w-4 mr-2 text-indigo-500" />
                    )}
                    <span className={value === o.value ? "" : "ml-6"}>
                      {o.label}
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const SummaryCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: "indigo" | "green" | "blue" | "purple";
  icon: React.ReactNode;
}) => {
  const colorMap: Record<string, string> = {
    indigo:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300",
    green:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
    purple:
      "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  };
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex items-center gap-3">
      <div className={`rounded-md p-2 ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

export default ScheduledVisits;
