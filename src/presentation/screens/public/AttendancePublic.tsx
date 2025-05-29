import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClockIcon,
  UserIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { doc, getDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import LoadingApp from "../../components/shared/loaders/LoadingApp";

// Helper function to safely convert Firestore timestamps to Date objects
const safeFirestoreDate = (firestoreDate: any): Date => {
  if (!firestoreDate) return new Date();
  if (firestoreDate.toDate && typeof firestoreDate.toDate === "function") {
    return firestoreDate.toDate();
  }
  return new Date(firestoreDate);
};

// Interface para el empleado
interface Employee {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  employmentInfo: {
    employeeNumber: string;
    pin: string;
  };
}

const AttendancePublic: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qrValid, setQrValid] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  const [formData, setFormData] = useState({
    employeeNumber: "",
    pin: "",
    type: "check-in" as "check-in" | "check-out",
  });

  useEffect(() => {
    const validateQR = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!qrId) {
          throw new Error("ID de QR no válido");
        }

        // Obtener clientId y condominiumId de los parámetros de la URL
        const clientId = searchParams.get("clientId");
        const condominiumId = searchParams.get("condominiumId");

        if (!clientId || !condominiumId) {
          throw new Error(
            "Información de cliente o condominio no encontrada en el enlace"
          );
        }

        // Acceder al QR usando la estructura completa
        const qrDocRef = doc(
          db,
          `clients/${clientId}/condominiums/${condominiumId}/attendanceQR/${qrId}`
        );
        const qrDoc = await getDoc(qrDocRef);

        if (!qrDoc.exists()) {
          throw new Error("Código QR no válido");
        }

        const data = qrDoc.data();

        // Verificar si no ha expirado
        const expiresAt = safeFirestoreDate(data.expiresAt);
        const now = new Date();

        if (!data.active) {
          throw new Error("Código QR desactivado");
        }

        if (expiresAt <= now) {
          throw new Error(
            "Código QR expirado. Solicite uno nuevo a la administración."
          );
        }

        // Agregar la información del cliente y condominio al qrData
        setQrData({
          ...data,
          clientId,
          condominiumId,
        });
        setQrValid(true);
      } catch (error: any) {
        console.error("Error validating QR:", error);
        setError(error.message || "Error al validar el código QR");
      } finally {
        setLoading(false);
      }
    };

    validateQR();
  }, [qrId, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeNumber || !formData.pin) {
      setError("Por favor complete todos los campos");
      return;
    }

    if (formData.pin.length !== 4) {
      setError("El PIN debe tener 4 dígitos");
      return;
    }

    if (!qrData) {
      setError("Datos del QR no disponibles");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const { clientId, condominiumId } = qrData;

      // Buscar empleado por número y PIN
      const employeesRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/employees`
      );
      const employeesSnapshot = await getDocs(employeesRef);

      let employee: Employee | null = null;
      employeesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.employmentInfo?.employeeNumber === formData.employeeNumber &&
          data.employmentInfo?.pin === formData.pin
        ) {
          employee = {
            id: doc.id,
            personalInfo: {
              firstName: data.personalInfo?.firstName || "",
              lastName: data.personalInfo?.lastName || "",
            },
            employmentInfo: {
              employeeNumber: data.employmentInfo?.employeeNumber || "",
              pin: data.employmentInfo?.pin || "",
            },
          };
        }
      });

      if (!employee) {
        throw new Error("Número de empleado o PIN incorrecto");
      }

      // En este punto, employee no es null
      const validEmployee = employee as Employee;

      // Crear registro de asistencia - usar una colección a nivel de condominio
      const attendanceRef = collection(
        db,
        `clients/${clientId}/condominiums/${condominiumId}/attendance`
      );

      const attendanceRecord = {
        employeeId: validEmployee.id,
        employeeNumber: validEmployee.employmentInfo.employeeNumber,
        employeeName: `${validEmployee.personalInfo.firstName} ${validEmployee.personalInfo.lastName}`,
        type: formData.type,
        timestamp: new Date(),
        method: "qr",
        qrId: qrId,
      };

      await addDoc(attendanceRef, attendanceRecord);

      setSuccess(
        formData.type === "check-in"
          ? "✅ Entrada registrada exitosamente"
          : "✅ Salida registrada exitosamente"
      );

      // Limpiar formulario
      setFormData({
        employeeNumber: "",
        pin: "",
        type: "check-in",
      });
    } catch (error: any) {
      console.error("Error processing attendance:", error);
      setError(error.message || "Error al procesar el registro");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingApp />
      </div>
    );
  }

  if (error && !qrValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Código QR No Válido
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Contacte a la administración para obtener un código QR válido.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ClockIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registro de Asistencia
          </h1>
          <p className="text-gray-600">
            Ingresa tus datos para registrar tu entrada o salida
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && qrValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Empleado
            </label>
            <div className="relative">
              <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.employeeNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employeeNumber: e.target.value.trim(),
                  }))
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: EMP001"
              />
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN (4 dígitos)
            </label>
            <div className="relative">
              <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                required
                maxLength={4}
                value={formData.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setFormData((prev) => ({
                    ...prev,
                    pin: value,
                  }));
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest"
                placeholder="••••"
              />
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "check-in" }))
                }
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.type === "check-in"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🟢</div>
                  <div className="font-medium">Entrada</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "check-out" }))
                }
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.type === "check-out"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-red-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🔴</div>
                  <div className="font-medium">Salida</div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processing || !formData.employeeNumber || !formData.pin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              `Registrar ${formData.type === "check-in" ? "Entrada" : "Salida"}`
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Estate Admin - Sistema de Gestión Condominial
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendancePublic;
