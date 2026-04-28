import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import "moment/locale/es";
import {
  ScheduledVisit,
  ScheduledVisitEntry,
  formatDaysOfWeek,
  getCheckInAt,
  getCheckOutAt,
  statusBadgeClasses,
  statusLabel,
  toDate,
  useScheduledVisitsStore,
  visitTypeLabel,
} from "../../../../store/useScheduledVisitsStore";

interface Props {
  open: boolean;
  onClose: () => void;
  visit: ScheduledVisit | null;
}

moment.locale("es");

const formatTimestamp = (value: any): string => {
  const d = toDate(value);
  if (!d) return "—";
  return moment(d).format("D [de] MMMM YYYY, h:mm A");
};

const ScheduledVisitDetailModal = ({ open, onClose, visit }: Props) => {
  const { cancelVisit, subscribeToEntries } = useScheduledVisitsStore();
  const [entries, setEntries] = useState<ScheduledVisitEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!open || !visit || visit.visitType !== "recurring") {
      setEntries([]);
      return;
    }

    let unsub: (() => void) | undefined;
    setLoadingEntries(true);
    subscribeToEntries(visit.id, (newEntries) => {
      setEntries(newEntries);
      setLoadingEntries(false);
    }).then((u) => {
      if (u) unsub = u;
    });

    return () => {
      if (unsub) unsub();
    };
  }, [open, visit, subscribeToEntries]);

  useEffect(() => {
    if (!open) {
      setShowQR(false);
    }
  }, [open]);

  if (!visit) return null;

  const handleCancel = async () => {
    setCancelling(true);
    await cancelVisit(visit.id);
    setCancelling(false);
    setConfirmCancelOpen(false);
    onClose();
  };

  const residentName =
    [visit.resident?.name, visit.resident?.lastName]
      .filter(Boolean)
      .join(" ") || visit.resident?.email || "—";

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 dark:bg-gray-800">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
                      onClick={onClose}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-2">
                      <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {visit.visitorName || "Visitante"}
                      </Dialog.Title>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                            visit.status,
                          )}`}
                        >
                          {statusLabel(visit.status)}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/30 px-2 py-0.5 text-xs font-medium">
                          {visitTypeLabel(visit.visitType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-5">
                    {/* Datos de la visita */}
                    <section>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Detalle de la visita
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-2 text-sm">
                        {visit.visitType === "single" ? (
                          <>
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Llegada"
                              value={
                                visit.arrivalAtLabel ||
                                formatTimestamp(visit.arrivalAt)
                              }
                            />
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Salida"
                              value={
                                visit.departureAtLabel ||
                                formatTimestamp(visit.departureAt)
                              }
                            />
                          </>
                        ) : (
                          <>
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Días"
                              value={formatDaysOfWeek(
                                visit.recurrence?.daysOfWeek || [],
                              )}
                            />
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Horario diario"
                              value={`${visit.recurrence?.dailyArrivalTime || "?"} – ${
                                visit.recurrence?.dailyDepartureTime || "?"
                              }`}
                            />
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Vigencia"
                              value={`${formatTimestamp(
                                visit.recurrence?.startDate,
                              )} → ${formatTimestamp(
                                visit.recurrence?.endDate,
                              )}`}
                            />
                            <Row
                              icon={<ClockIcon className="h-4 w-4" />}
                              label="Próxima ocurrencia"
                              value={visit.arrivalAtLabel}
                            />
                          </>
                        )}
                        {visit.visitorVehicle &&
                          (visit.visitorVehicle.plates ||
                            visit.visitorVehicle.description) && (
                            <Row
                              icon={<TruckIcon className="h-4 w-4" />}
                              label="Vehículo"
                              value={[
                                visit.visitorVehicle.plates,
                                visit.visitorVehicle.description,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            />
                          )}
                      </div>
                    </section>

                    {/* Datos del residente */}
                    <section>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Residente
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-2 text-sm">
                        <Row
                          icon={<UserIcon className="h-4 w-4" />}
                          label="Nombre"
                          value={residentName}
                        />
                        <Row
                          icon={<HomeIcon className="h-4 w-4" />}
                          label="Departamento"
                          value={
                            [
                              visit.resident.tower
                                ? `Torre ${visit.resident.tower}`
                                : null,
                              visit.resident.departmentNumber
                                ? `Depto ${visit.resident.departmentNumber}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"
                          }
                        />
                        <Row
                          icon={<EnvelopeIcon className="h-4 w-4" />}
                          label="Email"
                          value={visit.resident.email || "—"}
                        />
                        <Row
                          icon={<PhoneIcon className="h-4 w-4" />}
                          label="Teléfono"
                          value={visit.resident.phoneNumber || "—"}
                        />
                      </div>
                    </section>

                    {/* Registros (single) — programado vs real */}
                    {visit.visitType === "single" && (
                      <section>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Registro de entrada / salida
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Programada
                            </div>
                            <div className="flex flex-col gap-1">
                              <Row
                                icon={<ClockIcon className="h-4 w-4" />}
                                label="Llegada"
                                value={
                                  visit.arrivalAtLabel ||
                                  formatTimestamp(visit.arrivalAt)
                                }
                              />
                              <Row
                                icon={<ClockIcon className="h-4 w-4" />}
                                label="Salida"
                                value={
                                  visit.departureAtLabel ||
                                  formatTimestamp(visit.departureAt)
                                }
                              />
                            </div>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Real (caseta)
                            </div>
                            <div className="flex flex-col gap-1">
                              <Row
                                icon={
                                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-green-600" />
                                }
                                label="Check-in"
                                value={
                                  getCheckInAt(visit)
                                    ? formatTimestamp(getCheckInAt(visit))
                                    : "Sin registro"
                                }
                              />
                              <Row
                                icon={
                                  <ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                                }
                                label="Check-out"
                                value={
                                  getCheckOutAt(visit)
                                    ? formatTimestamp(getCheckOutAt(visit))
                                    : "Sin registro"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Historial (recurring) */}
                    {visit.visitType === "recurring" && (
                      <section>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Historial de entradas y salidas
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 max-h-64 overflow-y-auto">
                          {loadingEntries ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                              Cargando…
                            </p>
                          ) : entries.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                              Aún no hay registros para esta visita.
                            </p>
                          ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                              {entries.map((e) => (
                                <li
                                  key={e.id}
                                  className="py-2 flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    {e.type === "check-in" ? (
                                      <ArrowRightOnRectangleIcon className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <ArrowLeftOnRectangleIcon className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {e.type === "check-in"
                                        ? "Entrada"
                                        : "Salida"}
                                    </span>
                                  </div>
                                  <span className="text-gray-600 dark:text-gray-300">
                                    {formatTimestamp(e.createdAt)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </section>
                    )}

                    {/* QR */}
                    {visit.qrImageUrl && (
                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            Código QR
                          </h4>
                          <button
                            onClick={() => setShowQR(!showQR)}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {showQR ? "Ocultar QR" : "Mostrar QR"}
                          </button>
                        </div>
                        {showQR && (
                          <div className="bg-white dark:bg-gray-700/50 rounded-md p-3 flex flex-col items-center gap-3">
                            <img
                              src={visit.qrImageUrl}
                              alt="QR de la visita"
                              className="w-48 h-48 object-contain bg-white p-2 rounded"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              ⚠️ Este QR contiene un token de acceso. No lo
                              compartas con nadie distinto del visitante.
                            </p>
                            <a
                              href={visit.qrImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Abrir en nueva pestaña
                            </a>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Metadatos */}
                    <section className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p>Creada: {formatTimestamp(visit.createdAt)}</p>
                      {visit.condominiumName && (
                        <p>Condominio: {visit.condominiumName}</p>
                      )}
                      {visit.status === "cancelled" && visit.cancelledAt && (
                        <p>Cancelada: {formatTimestamp(visit.cancelledAt)}</p>
                      )}
                    </section>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600"
                      onClick={onClose}
                    >
                      Cerrar
                    </button>
                    {visit.status === "active" && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelOpen(true)}
                        className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Cancelar visita
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modal de confirmación inline */}
      <Transition.Root show={confirmCancelOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
          onClose={() => !cancelling && setConfirmCancelOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6 dark:bg-gray-800">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900">
                      <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-200" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold text-gray-900 dark:text-gray-100"
                      >
                        Cancelar visita
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                        ¿Seguro que deseas cancelar la visita de{" "}
                        <span className="font-medium">{visit.visitorName}</span>
                        ? Esta acción no se puede deshacer y el QR dejará de
                        ser válido.
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                    <button
                      type="button"
                      disabled={cancelling}
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 sm:w-auto"
                      onClick={handleCancel}
                    >
                      {cancelling ? "Cancelando..." : "Sí, cancelar"}
                    </button>
                    <button
                      type="button"
                      disabled={cancelling}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-60 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-600"
                      onClick={() => setConfirmCancelOpen(false)}
                    >
                      Volver
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

const Row = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 dark:text-gray-500 mt-0.5">{icon}</div>
    <div className="flex-1 grid grid-cols-3 gap-2">
      <span className="col-span-1 text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="col-span-2 text-gray-900 dark:text-white">{value}</span>
    </div>
  </div>
);

export default ScheduledVisitDetailModal;
