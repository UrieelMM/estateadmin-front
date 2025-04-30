import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/es";
import {
  usePettyCashStore,
  PettyCashAuditStatus,
} from "../../../../../../store/pettyCashStore";
import { formatCurrency } from "../../../../../../utils/curreyncy";

moment.locale("es");

const PettyCashAudits: React.FC = () => {
  const navigate = useNavigate();
  const {
    audits,
    fetchAudits,
    approveAudit,
    rejectAudit,
    loading,
    error: storeError,
  } = usePettyCashStore();

  // Estados
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [createAdjustment, setCreateAdjustment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Cargar datos
  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Ordenar cierres por fecha (más reciente primero)
  const sortedAudits = [...audits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Manejar aprobación
  const handleApprove = async () => {
    if (!selectedAudit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await approveAudit(selectedAudit.id, createAdjustment);
      setSuccess("Cierre aprobado correctamente");
      setShowApprovalModal(false);

      // Recargar datos
      await fetchAudits();

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al aprobar el Cierre");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar rechazo
  const handleReject = async () => {
    if (!selectedAudit) return;
    if (!rejectionReason.trim()) {
      setError("Debes proporcionar una razón para el rechazo");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await rejectAudit(selectedAudit.id, rejectionReason);
      setSuccess("Cierre rechazado correctamente");
      setShowRejectionModal(false);
      setRejectionReason("");

      // Recargar datos
      await fetchAudits();

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al rechazar el Cierre");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir modal de detalles
  const openDetailsModal = (audit: any) => {
    setSelectedAudit(audit);
    setShowDetailsModal(true);
  };

  // Abrir modal de aprobación
  const openApprovalModal = (audit: any) => {
    setSelectedAudit(audit);
    setCreateAdjustment(true);
    setShowApprovalModal(true);
  };

  // Abrir modal de rechazo
  const openRejectionModal = (audit: any) => {
    setSelectedAudit(audit);
    setShowRejectionModal(true);
  };

  // Obtener clase de estado
  const getStatusClass = (status: string) => {
    switch (status) {
      case PettyCashAuditStatus.APPROVED:
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case PettyCashAuditStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
    }
  };

  // Obtener texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case PettyCashAuditStatus.APPROVED:
        return "Aprobado";
      case PettyCashAuditStatus.REJECTED:
        return "Rechazado";
      default:
        return "Pendiente";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Administrar Cierres de Caja
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/pettycash")}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Volver
            </button>
            <button
              type="button"
              onClick={() => fetchAudits()}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 text-sm rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <ArrowPathIcon className="h-5 w-5 mr-1" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Mensajes de estado */}
        {error && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {storeError && (
          <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <p>{storeError}</p>
          </div>
        )}

        {/* Tabla de Cierres */}
        {loading ? (
          <div className="flex justify-center py-8">
            <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay Cierres registrados
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              No se han registrado Cierres de caja. Puedes crear un nuevo Cierre
              desde la sección "Realizar Cierre".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Periodo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto según el sistema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto Físico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAudits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {moment(audit.date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {audit.cashBoxPeriod || "Sin periodo"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {audit.userName || "Usuario"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(audit.theoreticalAmount / 100)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatCurrency(audit.physicalAmount / 100)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          audit.difference > 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : audit.difference < 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {formatCurrency(audit.difference / 100)}
                        {audit.difference > 0
                          ? " (sobrante)"
                          : audit.difference < 0
                          ? " (faltante)"
                          : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          audit.status
                        )}`}
                      >
                        {getStatusText(audit.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => openDetailsModal(audit)}
                          className="text-indigo-600 bg-indigo-50 rounded-md text-sm px-1 py-2 hover:text-indigo-900 dark:text-indigo-600 dark:hover:text-indigo-800"
                        >
                          Ver detalles
                        </button>
                        {audit.status === PettyCashAuditStatus.PENDING && (
                          <>
                            <button
                              onClick={() => openApprovalModal(audit)}
                              className="text-green-600 bg-green-50 rounded-md text-sm px-1 py-2 hover:text-green-900 dark:text-green-600 dark:hover:text-green-800"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => openRejectionModal(audit)}
                              className="text-red-600 bg-red-50 rounded-md text-sm px-1 py-2 hover:text-red-900 dark:text-red-600 dark:hover:text-red-800"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de aprobación */}
      {showApprovalModal && selectedAudit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Aprobar Cierre de Caja
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <p className="text-gray-600 dark:text-gray-300">
                  Estás a punto de aprobar el Cierre de Caja del{" "}
                  {moment(selectedAudit.date).format("DD/MM/YYYY")}.
                </p>
                {selectedAudit.difference !== 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      <strong>Atención:</strong> Este Cierre tiene una
                      diferencia de{" "}
                      {formatCurrency(selectedAudit.difference / 100)}{" "}
                      {selectedAudit.difference > 0
                        ? "(sobrante)"
                        : "(faltante)"}
                      .
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createAdjustment}
                    onChange={(e) => setCreateAdjustment(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Crear ajuste automático para la diferencia
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Si está marcado, se creará una transacción de ajuste para
                  registrar la diferencia encontrada.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin inline" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar Aprobación"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedAudit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Detalles del Cierre de Caja
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información General
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fecha
                        </p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {moment(selectedAudit.date).format("DD/MM/YYYY")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Usuario
                        </p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {selectedAudit.userName || "Usuario"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información Financiera
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Monto según el sistema
                        </p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {formatCurrency(
                            selectedAudit.theoreticalAmount / 100
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Monto Físico
                        </p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {formatCurrency(selectedAudit.physicalAmount / 100)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Diferencia
                        </p>
                        <p
                          className={`text-base font-medium ${
                            selectedAudit.difference > 0
                              ? "text-green-600 dark:text-green-400"
                              : selectedAudit.difference < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {formatCurrency(selectedAudit.difference / 100)}{" "}
                          {selectedAudit.difference > 0
                            ? "(sobrante)"
                            : selectedAudit.difference < 0
                            ? "(faltante)"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${getStatusClass(
                          selectedAudit.status
                        )}`}
                      >
                        {getStatusText(selectedAudit.status)}
                      </span>
                      {selectedAudit.status === PettyCashAuditStatus.APPROVED &&
                        selectedAudit.approvedBy && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Aprobado por{" "}
                            <span className="font-medium">
                              {selectedAudit.approvedBy}
                            </span>{" "}
                            el{" "}
                            {selectedAudit.approvedAt
                              ? moment(selectedAudit.approvedAt).format(
                                  "DD/MM/YYYY HH:mm"
                                )
                              : "fecha desconocida"}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {selectedAudit.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAudit.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRejectionModal && selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Rechazar Cierre de Caja
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                ¿Estás seguro de que deseas rechazar este Cierre? Esta acción no
                se puede deshacer.
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="rejectionReason"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Razón del rechazo *
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explica por qué estás rechazando este Cierre"
                />
              </div>

              {error && (
                <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <p>{error}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  "Rechazar Cierre"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export { PettyCashAudits as default };
