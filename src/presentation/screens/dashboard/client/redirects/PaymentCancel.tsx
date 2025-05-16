import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { XCircleIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import useClientInvoicesStore, {
  ClientInvoice,
} from "../../../../../store/useClientInvoicesStore";

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
    navigate("/dashboard/client-config", { state: { activeTab: "payments" } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-red-950 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center transform transition-all animate-fade-in-up">
        <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <XCircleIcon className="h-14 w-14 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Pago cancelado
        </h1>

        <div className="h-1 w-16 bg-red-500 mx-auto mb-6 rounded-full"></div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo a tu
          tarjeta.
        </p>

        {/* Mostrar información de la factura si está disponible */}
        {invoiceData && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium text-red-700 dark:text-red-400 mb-2 text-sm uppercase tracking-wide">
              Factura cancelada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Número:</span>{" "}
              {invoiceData.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Concepto:</span>{" "}
              {invoiceData.concept}
            </p>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-8">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm uppercase tracking-wide">
            ¿Tuviste algún problema?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Si encontraste dificultades durante el proceso, puedes intentarlo
            nuevamente o contactar a nuestro equipo de soporte.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGoBack}
            className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <span>Volver a facturas</span>
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Puedes reiniciar el proceso de pago en cualquier momento desde tu
          panel de configuración.
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;
