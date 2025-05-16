import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useClientInvoicesStore, {
  ClientInvoice,
} from "../../../../../store/useClientInvoicesStore";
import { CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import LoadingApp from "../../../../components/shared/loaders/LoadingApp";

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkPaymentStatus, searchInvoiceByNumber } =
    useClientInvoicesStore();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<ClientInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);

        // Obtener el ID de sesión y el ID de factura de los parámetros de consulta
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get("session_id");
        const invoiceId = queryParams.get("invoice_id");

        if (!sessionId) {
          setError("No se encontró información del pago");
          setLoading(false);
          return;
        }

        // Verificar el estado del pago
        const paymentInfo = await checkPaymentStatus(sessionId);
        setPaymentData(paymentInfo);

        // Si el pago no está completado
        if (paymentInfo.status !== "paid") {
          setError("El pago no ha sido completado correctamente");
        } else if (invoiceId || paymentInfo.metadata?.invoiceId) {
          // Intentar obtener información detallada de la factura
          // Primero usar el ID de la URL y luego el de los metadatos como respaldo
          if (paymentInfo.metadata?.invoiceNumber) {
            const invoices = await searchInvoiceByNumber(
              paymentInfo.metadata.invoiceNumber
            );
            if (invoices && invoices.length > 0) {
              setInvoiceData(invoices[0]);
            }
          }
        }
      } catch (error: any) {
        console.error("Error al verificar el pago:", error);
        setError(error.message || "Error al verificar el pago");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search, checkPaymentStatus, searchInvoiceByNumber]);

  const handleGoBack = () => {
    navigate("/dashboard/client-config", { state: { activeTab: "payments" } });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("es-MX");
    } catch (error) {
      return "Fecha inválida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-green-950">
        <div className="text-center">
          <LoadingApp />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Verificando el estado de tu pago...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-red-950 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center transform transition-all animate-fade-in-up">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-14 w-14 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Error en el proceso de pago
          </h1>

          <div className="h-1 w-16 bg-red-500 mx-auto mb-6 rounded-full"></div>

          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
            {error}
          </p>

          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <span>Volver a mis facturas</span>
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-900 dark:to-green-950 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center transform transition-all animate-fade-in-up">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircleIcon className="h-14 w-14 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          ¡Pago exitoso!
        </h1>

        <div className="h-1 w-16 bg-green-500 mx-auto mb-6 rounded-full"></div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
          Tu pago ha sido procesado correctamente. Se enviará un comprobante a
          tu correo electrónico.
        </p>

        {/* Mostrar datos de la factura si están disponibles */}
        {(invoiceData || (paymentData && paymentData.metadata)) && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-8">
            <h3 className="font-medium text-green-700 dark:text-green-400 mb-2 text-sm uppercase tracking-wide">
              Detalles del pago
            </h3>

            {/* Mostrar información detallada si tenemos datos de la factura */}
            {invoiceData ? (
              <div className="space-y-2 text-left">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Factura:</span>{" "}
                  {invoiceData.invoiceNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Concepto:</span>{" "}
                  {invoiceData.concept}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Monto:</span>{" "}
                  {formatCurrency(invoiceData.amount)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Fecha de emisión:</span>{" "}
                  {formatDate(invoiceData.createdAt)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Fecha de pago:</span>{" "}
                  {formatDate(new Date())}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Método de pago:</span> Tarjeta
                  de crédito/débito
                </p>
              </div>
            ) : (
              // Información básica de los metadatos si no tenemos la factura completa
              <p className="text-sm text-gray-600 dark:text-gray-300 text-left">
                <span className="font-medium">Factura:</span>{" "}
                {paymentData?.metadata?.invoiceNumber || "N/A"}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleGoBack}
          className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] shadow-lg"
        >
          <span>Volver a mis facturas</span>
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </button>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de
          soporte.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
