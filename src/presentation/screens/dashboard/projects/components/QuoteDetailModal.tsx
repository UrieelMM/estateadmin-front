import React from "react";
import { Dialog } from "@headlessui/react";
import { ProjectQuote, QuoteStatus } from "../../../../../store/projectStore";
import moment from "moment";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: ProjectQuote;
}

const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  isOpen,
  onClose,
  quote,
}) => {
  // Función para obtener el label del estado en español
  const getStatusLabel = (status: QuoteStatus): string => {
    switch (status) {
      case QuoteStatus.PENDING:
        return "Pendiente";
      case QuoteStatus.APPROVED:
        return "Aprobada";
      case QuoteStatus.REJECTED:
        return "Rechazada";
      case QuoteStatus.SELECTED:
        return "Seleccionada";
      default:
        return "";
    }
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: QuoteStatus): string => {
    switch (status) {
      case QuoteStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case QuoteStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case QuoteStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case QuoteStatus.SELECTED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  // Comprobar si la cotización está expirada
  const isExpired = moment(quote.validUntil).isBefore(moment(), "day");

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white p-6 dark:bg-gray-800 dark:text-gray-100 shadow-xl">
            <Dialog.Title className="text-lg font-medium border-b pb-2 mb-4 dark:border-gray-700 flex justify-between items-center">
              <span>Detalle de Cotización</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  quote.status
                )}`}
              >
                {getStatusLabel(quote.status)}
              </span>
            </Dialog.Title>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Información General
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Concepto
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {quote.concept}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Proveedor
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {quote.providerName}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Monto
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      $
                      {quote.amount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Válido Hasta
                    </label>
                    <p
                      className={`text-sm font-medium ${
                        isExpired
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {moment(quote.validUntil).format("DD/MM/YYYY")}
                      {isExpired && (
                        <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                          (Expirada)
                        </span>
                      )}
                    </p>
                  </div>

                  {quote.deliveryDate && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400">
                        Fecha de Entrega
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {moment(quote.deliveryDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  )}

                  {quote.startDate && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400">
                        Fecha de Inicio
                      </label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {moment(quote.startDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">
                      Fecha de Registro
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {moment(quote.createdAt).format("DD/MM/YYYY HH:mm")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Información de Contacto
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {quote.contactName ? (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 dark:text-gray-400">
                          Nombre
                        </label>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {quote.contactName}
                        </p>
                      </div>

                      {quote.contactEmail && (
                        <div className="mb-3">
                          <label className="block text-xs text-gray-500 dark:text-gray-400">
                            Email
                          </label>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {quote.contactEmail}
                          </p>
                        </div>
                      )}

                      {quote.contactPhone && (
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400">
                            Teléfono
                          </label>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {quote.contactPhone}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No se proporcionó información de contacto.
                    </p>
                  )}
                </div>

                {quote.fileUrls && quote.fileUrls.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Archivos Adjuntos
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {quote.fileUrls.map((url, index) => (
                          <li key={index}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                              Descargar archivo {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Descripción
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {quote.description}
                  </p>
                </div>
              </div>

              {quote.notes && (
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notas Adicionales
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {quote.notes}
                    </p>
                  </div>
                </div>
              )}

              {quote.warranty && (
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Garantías Ofrecidas
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {quote.warranty}
                    </p>
                  </div>
                </div>
              )}

              {quote.termsAndConditions && (
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Términos y Condiciones
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {quote.termsAndConditions}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Cerrar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default QuoteDetailModal;
