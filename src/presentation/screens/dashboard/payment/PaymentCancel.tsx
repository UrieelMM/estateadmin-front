import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { XCircleIcon } from "@heroicons/react/24/outline";
import useClientInvoicesStore, {
  ClientInvoice,
} from "../../../../store/useClientInvoicesStore";

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchInvoiceByNumber } = useClientInvoicesStore();
  const [invoiceData, setInvoiceData] = useState<ClientInvoice | null>(null);

  useEffect(() => {
    const getInvoiceInfo = async () => {
      try {
        // Obtener el ID de factura de los parámetros de consulta
        const queryParams = new URLSearchParams(location.search);
        const invoiceId = queryParams.get("invoice_id");

        // Si tenemos un ID de factura, intentar obtener información adicional
        if (invoiceId) {
          // Normalmente buscaríamos por ID, pero como searchInvoiceByNumber es lo que tenemos disponible,
          // usamos eso como ejemplo. En un escenario real, añadiríamos un método para buscar por ID.
          const invoices = await searchInvoiceByNumber(invoiceId);
          if (invoices && invoices.length > 0) {
            setInvoiceData(invoices[0]);
          }
        }
      } catch (error) {
        console.error("Error al obtener información de la factura:", error);
      }
    };

    getInvoiceInfo();
  }, [location.search, searchInvoiceByNumber]);

  const handleGoBack = () => {
    navigate("/dashboard/config", { state: { activeTab: "payments" } });
  };

  const handleRetryPayment = () => {
    if (invoiceData) {
      // Redirigir a la página de facturas, manteniendo la información para facilitar un nuevo intento
      navigate("/dashboard/config", {
        state: {
          activeTab: "payments",
          retryInvoiceId: invoiceData.id,
        },
      });
    } else {
      // Si no tenemos datos de la factura, simplemente redirigir a la página de facturas
      handleGoBack();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
        <div className="text-yellow-500 mb-4">
          <XCircleIcon className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Pago cancelado
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu
          tarjeta.
        </p>

        {/* Mostrar información de la factura si está disponible */}
        {invoiceData && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Factura cancelada:</span>{" "}
              {invoiceData.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Concepto:</span>{" "}
              {invoiceData.concept}
            </p>
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Si tuviste algún problema durante el proceso, puedes intentarlo
          nuevamente o contactar a soporte.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Intentar nuevamente
          </button>
          <button
            onClick={handleGoBack}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Volver a mis facturas
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
