import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  UnidentifiedPayment,
  useUnidentifiedPaymentsStore,
} from "../../../store/useUnidentifiedPaymentsStore";

const UnidentifiedPaymentsPublic = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const { getQRData } = useUnidentifiedPaymentsStore();
  const [payments, setPayments] = useState<UnidentifiedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!qrId) {
          throw new Error("ID de QR no válido");
        }

        const qrPayments = await getQRData(qrId);
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
    let date: Date;
    if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("es-MX");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnidentifiedPaymentsPublic;
