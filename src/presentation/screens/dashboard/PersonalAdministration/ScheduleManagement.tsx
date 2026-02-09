import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";
import { usePersonalAdministrationStore } from "../../../../store/PersonalAdministration";
import { getAuth, getIdTokenResult } from "firebase/auth";
import ActionModal from "../../../components/shared/modals/ActionModal";

const ScheduleManagement: React.FC = () => {
  const {
    activeQR,
    generateAttendanceQR,
    getActiveQR,
    deactivateQR,
    fetchAttendanceRecords,
    getAttendanceForDay,
    fetchEmployees,
  } = usePersonalAdministrationStore();

  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedDayAttendance, setSelectedDayAttendance] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "info" | "success" | "warning" | "danger";
    confirmLabel: string;
    cancelLabel: string;
    showCancel: boolean;
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "info",
    confirmLabel: "Aceptar",
    cancelLabel: "Cancelar",
    showCancel: false,
  });

  const openAlertModal = (
    title: string,
    message: string,
    variant: "info" | "success" | "warning" | "danger" = "info",
    confirmLabel = "Aceptar"
  ) => {
    setActionModal({
      open: true,
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel: "Cancelar",
      showCancel: false,
    });
  };

  const openConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: "info" | "success" | "warning" | "danger" = "warning",
    confirmLabel = "Confirmar"
  ) => {
    setActionModal({
      open: true,
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel: "Cancelar",
      showCancel: true,
      onConfirm,
    });
  };

  // Cargar empleados, QR activo y registros de asistencia al montar el componente
  useEffect(() => {
    fetchEmployees();
    getActiveQR();

    // Cargar registros de asistencia de la semana actual
    const startOfWeek = getStartOfWeek(selectedWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    fetchAttendanceRecords(startOfWeek, endOfWeek);
  }, [fetchEmployees, getActiveQR, fetchAttendanceRecords, selectedWeek]);

  // Calcular días restantes para expiración del QR
  const getDaysUntilExpiration = () => {
    if (!activeQR) return null;

    const now = new Date();
    const expiresAt = new Date(activeQR.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDaysOfWeek = () => {
    const startOfWeek = getStartOfWeek(selectedWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Función para obtener color basado en el estado de asistencia
  const getAttendanceColor = (checkIn: any, checkOut: any) => {
    if (checkIn && checkOut) {
      return "bg-green-500 text-white"; // Jornada completa
    } else if (checkIn) {
      return "bg-yellow-500 text-white"; // Solo entrada
    } else {
      return "bg-gray-400 text-white"; // Sin registros
    }
  };

  // Manejar clic en día para mostrar detalles
  const handleDayClick = (date: Date) => {
    const dayAttendanceRecords = getAttendanceForDay(date);

    if (dayAttendanceRecords.length === 0) return;

    // Agrupar registros por empleado
    const employeeGroups = dayAttendanceRecords.reduce((groups, record) => {
      if (!groups[record.employeeId]) {
        groups[record.employeeId] = {
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          records: [],
        };
      }
      groups[record.employeeId].records.push(record);
      return groups;
    }, {} as Record<string, any>);

    // Convertir a array y agregar información de estado
    const attendanceData = Object.values(employeeGroups).map((group: any) => {
      const checkIn = group.records.find((r: any) => r.type === "check-in");
      const checkOut = group.records.find((r: any) => r.type === "check-out");

      return {
        ...group,
        checkIn,
        checkOut,
        status:
          checkIn && checkOut
            ? "complete"
            : checkIn
            ? "in-progress"
            : "incomplete",
      };
    });

    setSelectedDayAttendance(attendanceData);
    setSelectedDate(date);
    setShowAttendanceModal(true);
  };

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true);
      const qrId = await generateAttendanceQR();

      // Obtener clientId del token y condominiumId del localStorage
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");

      const tokenResult = await getIdTokenResult(user);
      const clientId = tokenResult.claims["clientId"] as string;
      const condominiumId = localStorage.getItem("condominiumId");

      const url = `${window.location.origin}/attendance/${qrId}?clientId=${clientId}&condominiumId=${condominiumId}`;
      setQrUrl(url);
      setShowQRModal(true);
    } catch (error: any) {
      console.error("Error al generar QR:", error);
      openAlertModal(
        "Error",
        "Error al generar el código QR.",
        "danger"
      );
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDeactivateQR = async () => {
    if (!activeQR) return;

    openConfirmModal(
      "Desactivar código QR",
      "¿Estás seguro de que deseas desactivar el código QR actual?",
      async () => {
        try {
          await deactivateQR(activeQR.id);
          openAlertModal(
            "Código QR desactivado",
            "El código QR fue desactivado exitosamente.",
            "success"
          );
        } catch (error) {
          console.error("Error al desactivar QR:", error);
          openAlertModal(
            "Error",
            "Error al desactivar el código QR.",
            "danger"
          );
        }
      },
      "warning",
      "Desactivar"
    );
  };

  const printQR = () => {
    if (!qrRef.current) return;

    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const base64Image = canvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Código QR - Asistencia Personal</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  margin: 20px;
                }
                .qr-container { 
                  margin: 20px auto; 
                  padding: 20px;
                  border: 2px solid #000;
                  display: inline-block;
                }
                .qr-image { 
                  width: 300px; 
                  height: 300px; 
                }
                .instructions {
                  margin: 20px 0;
                  font-size: 16px;
                  line-height: 1.5;
                }
                .footer {
                  margin-top: 30px;
                  font-size: 12px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <h1>Código QR - Registro de Asistencia</h1>
              <div class="qr-container">
                <img src="${base64Image}" class="qr-image" alt="Código QR" />
              </div>
              <div class="instructions">
                <p><strong>Instrucciones:</strong></p>
                <p>1. Escanea este código QR con tu celular</p>
                <p>2. Ingresa tu número de empleado y PIN</p>
                <p>3. Selecciona "Entrada" o "Salida"</p>
                <p>4. Confirma tu registro</p>
                <br>
                <p><strong>Válido por 15 días</strong></p>
              </div>
              <div class="footer">
                Estate Admin - Sistema de Gestión Condominial
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const daysOfWeek = getDaysOfWeek();
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  return (
    <div className="space-y-6">
      {/* QR Status Alert */}
      {activeQR && daysUntilExpiration !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-4 border ${
            daysUntilExpiration <= 3
              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : daysUntilExpiration <= 7
              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
              : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {daysUntilExpiration <= 3 ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
              ) : daysUntilExpiration <= 7 ? (
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              ) : (
                <InformationCircleIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3
                className={`text-sm font-medium ${
                  daysUntilExpiration <= 3
                    ? "text-red-800 dark:text-red-200"
                    : daysUntilExpiration <= 7
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-blue-800 dark:text-blue-200"
                }`}
              >
                Código QR de Asistencia Activo
              </h3>
              <div
                className={`mt-1 text-sm ${
                  daysUntilExpiration <= 3
                    ? "text-red-700 dark:text-red-300"
                    : daysUntilExpiration <= 7
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}
              >
                <p>
                  {daysUntilExpiration <= 0
                    ? "⚠️ El código QR ha expirado"
                    : daysUntilExpiration === 1
                    ? "⚠️ El código QR expira mañana"
                    : `📅 El código QR expira en ${daysUntilExpiration} días`}
                </p>
                <p className="text-xs mt-1">
                  Creado:{" "}
                  {new Date(activeQR.createdAt).toLocaleDateString("es-MX")} •
                  Expira:{" "}
                  {new Date(activeQR.expiresAt).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>
            <div className="ml-3 flex space-x-2">
              {daysUntilExpiration <= 3 && (
                <button
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  Renovar QR
                </button>
              )}
              <button
                onClick={handleDeactivateQR}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Desactivar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Registros de Asistencia
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualiza y gestiona los registros de entrada y salida del personal
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleGenerateQR}
            disabled={generatingQR}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors duration-200"
          >
            <QrCodeIcon className="h-4 w-4 mr-2" />
            {generatingQR
              ? "Generando..."
              : activeQR
              ? "Nuevo QR Asistencia"
              : "Generar QR Asistencia"}
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const prevWeek = new Date(selectedWeek);
            prevWeek.setDate(prevWeek.getDate() - 7);
            setSelectedWeek(prevWeek);
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          ←
        </button>

        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Semana del {getStartOfWeek(selectedWeek).toLocaleDateString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Registros de asistencia
          </p>
        </div>

        <button
          onClick={() => {
            const nextWeek = new Date(selectedWeek);
            nextWeek.setDate(nextWeek.getDate() + 7);
            setSelectedWeek(nextWeek);
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          →
        </button>
      </div>

      {/* Weekly Calendar - Solo Registros de Asistencia */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const dayAttendanceRecords = getAttendanceForDay(day);

          // Agrupar registros por empleado
          const employeeGroups = dayAttendanceRecords.reduce(
            (groups, record) => {
              if (!groups[record.employeeId]) {
                groups[record.employeeId] = {
                  employeeName: record.employeeName,
                  records: [],
                };
              }
              groups[record.employeeId].records.push(record);
              return groups;
            },
            {} as Record<string, any>
          );

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 min-h-[200px] cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                isToday
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onClick={() => handleDayClick(day)}
            >
              {/* Day Header */}
              <div className="mb-4">
                <h4
                  className={`font-medium ${
                    isToday
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {dayNames[day.getDay()]}
                </h4>
                <p
                  className={`text-sm ${
                    isToday
                      ? "text-blue-500 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* Indicadores de empleados */}
              <div className="space-y-2">
                {Object.entries(employeeGroups).length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(employeeGroups).map(
                      ([employeeId, group]) => {
                        const checkIn = group.records.find(
                          (r: any) => r.type === "check-in"
                        );
                        const checkOut = group.records.find(
                          (r: any) => r.type === "check-out"
                        );
                        const initials = getInitials(group.employeeName);
                        const colorClass = getAttendanceColor(
                          checkIn,
                          checkOut
                        );

                        return (
                          <div
                            key={employeeId}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colorClass} shadow-sm`}
                            title={`${group.employeeName} - ${
                              checkIn && checkOut
                                ? "Jornada Completa"
                                : checkIn
                                ? "En Jornada"
                                : "Sin registros"
                            }`}
                          >
                            {initials}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-xs py-4">
                    Sin registros
                  </div>
                )}

                {/* Contador de registros */}
                {dayAttendanceRecords.length > 0 && (
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Object.keys(employeeGroups).length} empleado(s)
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowQRModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Código QR - Asistencia Personal
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div ref={qrRef} className="mb-4">
                  <QRCodeSVG value={qrUrl} size={200} />
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Escanea este código QR para registrar entrada y salida
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Válido por 15 días
                  </p>
                </div>

                <div className="flex space-x-3 w-full">
                  <button
                    onClick={printQR}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Imprimir QR
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard
                        .writeText(qrUrl)
                        .then(() =>
                          openAlertModal(
                            "URL copiada",
                            "La URL se copió al portapapeles.",
                            "success"
                          )
                        )
                        .catch(() =>
                          openAlertModal(
                            "Error",
                            "No se pudo copiar la URL al portapapeles.",
                            "danger"
                          )
                        );
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Copiar URL
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedDate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAttendanceModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registros de Asistencia - {selectedDate.toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {selectedDayAttendance.map((attendance) => (
                  <div
                    key={attendance.employeeId}
                    className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {attendance.employeeName}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {attendance.checkIn && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                            ✓ Entrada
                          </span>
                        )}
                        {attendance.checkOut && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            ✓ Salida
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mostrar horarios de check-in/check-out */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {attendance.checkIn && (
                        <div className="flex items-center justify-between">
                          <span>📍 Entrada:</span>
                          <span className="font-medium">
                            {attendance.checkIn.timestamp.toLocaleTimeString(
                              "es-MX",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            (
                            {attendance.checkIn.method === "qr"
                              ? "QR"
                              : "Manual"}
                            )
                          </span>
                        </div>
                      )}
                      {attendance.checkOut && (
                        <div className="flex items-center justify-between">
                          <span>📍 Salida:</span>
                          <span className="font-medium">
                            {attendance.checkOut.timestamp.toLocaleTimeString(
                              "es-MX",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            (
                            {attendance.checkOut.method === "qr"
                              ? "QR"
                              : "Manual"}
                            )
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Estado del registro */}
                    <div className="text-center">
                      {attendance.checkIn && attendance.checkOut ? (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✅ Jornada Completa
                        </div>
                      ) : attendance.checkIn ? (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          ⏳ En Jornada
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Sin registros
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
      <ActionModal
        open={actionModal.open}
        setOpen={(open) =>
          setActionModal((prev) => ({
            ...prev,
            open,
            onConfirm: open ? prev.onConfirm : undefined,
          }))
        }
        title={actionModal.title}
        message={actionModal.message}
        variant={actionModal.variant}
        confirmLabel={actionModal.confirmLabel}
        cancelLabel={actionModal.cancelLabel}
        showCancel={actionModal.showCancel}
        onConfirm={actionModal.onConfirm}
      />
    </div>
  );
};

export default ScheduleManagement;
