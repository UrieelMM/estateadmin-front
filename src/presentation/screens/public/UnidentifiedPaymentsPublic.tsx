import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  UnidentifiedPayment,
  useUnidentifiedPaymentsStore,
} from "../../../store/useUnidentifiedPaymentsStore";
import LoadingApp from "../../components/shared/loaders/LoadingApp";

const UnidentifiedPaymentsPublic = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const { getQRData } = useUnidentifiedPaymentsStore();
  const [payments, setPayments] = useState<UnidentifiedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const seoHead = (
    <Helmet>
      <title>Pagos No Identificados | EstateAdmin</title>
      <meta
        name="description"
        content="Vista temporal de pagos no identificados por QR."
      />
      <meta name="robots" content="noindex, nofollow" />
      <link
        rel="canonical"
        href={`https://estate-admin.com/unidentified-payments/${qrId || ""}`}
      />
    </Helmet>
  );

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsExpired(false);

        if (!qrId) {
          throw new Error("ID de QR no válido");
        }

        const qrPayments = await getQRData(qrId);

        // Verificar si el QR ha expirado
        if (qrPayments.length > 0 && qrPayments[0].expiresAt) {
          const expirationDate = new Date(
            qrPayments[0].expiresAt.seconds * 1000
          );
          if (expirationDate < new Date()) {
            setIsExpired(true);
            setError(
              "Este código QR ha expirado. Por favor, solicite uno nuevo."
            );
            return;
          }
        }

        setPayments(qrPayments);
      } catch (error: any) {
        console.error("Error al cargar pagos:", error);
        setError(
          "No se pudieron cargar los pagos. Por favor, intente más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [getQRData, qrId]);

  const formatDate = (timestamp: any): string => {
    try {
      let date: Date;

      // Si el timestamp es null o undefined
      if (!timestamp) {
        return "Fecha no disponible";
      }

      // Si es un string que representa una fecha
      if (typeof timestamp === "string") {
        date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return "Fecha inválida";
        }
        return date.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "America/Mexico_City",
        });
      }

      // Si es un objeto (timestamp de Firestore)
      if (typeof timestamp === "object") {
        // Timestamp de Firestore con _seconds
        if ("_seconds" in timestamp) {
          date = new Date(timestamp._seconds * 1000);
        }
        // Timestamp de Firestore con seconds
        else if ("seconds" in timestamp) {
          date = new Date(timestamp.seconds * 1000);
        }
        // Timestamp de Firestore con toDate()
        else if (
          "toDate" in timestamp &&
          typeof timestamp.toDate === "function"
        ) {
          date = timestamp.toDate();
        }
        // Si es un objeto Date
        else if (timestamp instanceof Date) {
          date = timestamp;
        }
        // Si no coincide con ningún formato conocido
        else {
          return "Formato de fecha no soportado";
        }
      } else {
        // Si es un número (timestamp en milisegundos)
        date = new Date(timestamp);
      }

      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }

      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Mexico_City",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error al formatear fecha";
    }
  };

  if (loading) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <LoadingApp />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-xl text-red-600">{error}</div>
        </div>
      </>
    );
  }

  if (isExpired) {
    return (
      <>
        {seoHead}
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-xl text-red-600">
            Este código QR ha expirado. Contacte a la administración para
            obtener uno nuevo.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {seoHead}
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Pagos No Identificados
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Lista de pagos no identificados de los últimos 30 días
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Última actualización: {new Date().toLocaleString("es-MX")}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de pago
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(payment.amountPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50">
              <p className="text-sm text-gray-500">
                Si su pago aparece en esta lista, por favor contacte a la
                administración para identificarlo.
              </p>
              <p className="text-sm font-bold mt-1 text-indigo-500">
                EstateAdmin
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnidentifiedPaymentsPublic;
