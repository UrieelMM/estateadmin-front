// NotificationBell.tsx
import React, { useState, useEffect, useRef } from "react";
import useNotificationStore, {
  UserNotification,
} from "../../../../store/useNotificationsStore";
import { BellIcon } from "@heroicons/react/16/solid";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import * as Sentry from "@sentry/react";

const dropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const NotificationBell: React.FC = () => {
  const { notifications, fetchNotifications, markAllAsRead } =
    useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Obtiene las notificaciones al montar el componente
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        await fetchNotifications();
      } catch (error) {
        Sentry.captureException(error);
        console.error("Error al cargar notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // No hacemos limpieza al desmontar para mantener la suscripción activa en tiempo real
  }, []); // Eliminamos la dependencia para evitar recargas innecesarias

  // Al abrir el dropdown, marca como leídas todas las notificaciones no leídas
  useEffect(() => {
    if (!dropdownOpen || notifications.length === 0) return;
    void markAllAsRead();
  }, [dropdownOpen, notifications.length, markAllAsRead]);

  useEffect(() => {
    if (!dropdownOpen) return;
    void fetchNotifications();
  }, [dropdownOpen, fetchNotifications]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void fetchNotifications();
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  // Mostrar solo las últimas 15 notificaciones
  const latestNotifications = notifications.slice(0, 15);
  const unreadCount = notifications.filter(
    (notif: UserNotification) => !notif.read
  ).length;

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-indigo-700 text-white";
      case "high":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100";
      case "medium":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "Crítica";
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
      default:
        return "Baja";
    }
  };

  const getModuleLabel = (module?: string) => {
    switch (module) {
      case "inventory":
        return "Inventario";
      case "maintenance":
        return "Mantenimiento";
      case "staff":
        return "Personal";
      case "projects":
        return "Proyectos";
      case "finance":
        return "Finanzas";
      case "system":
        return "Sistema";
      default:
        return "Sistema";
    }
  };

  // Función para formatear el monto en el body
  // Se asume que el body viene con el formato: "Monto: <amount>. Vence: <dueDate>. <optionalMessage>"
  const formatNotificationBody = (body: string): string => {
    const regex = /Monto:\s*([\d.,]+)\. Vence:\s*([^\.]+)\.?(.*)/;
    const match = body.match(regex);
    if (match) {
      const amountStr = match[1];
      // Se remueven comas y se parsea a número
      const parsedAmount = parseFloat(amountStr.replace(/,/g, ""));
      const formattedAmount = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(parsedAmount);
      const dueDate = match[2].trim();
      const optionalMsg = match[3].trim();
      return `Monto: ${formattedAmount}. Vence: ${dueDate}. ${optionalMsg}`;
    }
    return body;
  };

  const isInvoicePendingNotification = (notif: UserNotification) =>
    notif.eventType === "finance.invoice_pending_payment";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative focus:outline-none bg-white rounded-full p-1 dark:bg-gray-800"
        aria-label="Notificaciones"
      >
        <BellIcon className="h-[24px] w-[24px] text-indigo-400" />
        {loading ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gray-300 animate-pulse"
          />
        ) : unreadCount > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
          >
            {unreadCount}
          </motion.span>
        ) : null}
      </button>
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            key="dropdown"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dropdownVariants}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-2xl z-50 dark:bg-gray-900"
          >
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent" />
                </div>
              ) : latestNotifications.length === 0 ? (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  No hay notificaciones.
                </p>
              ) : (
                <div className="max-h-[390px] overflow-y-auto pr-1">
                  {latestNotifications.map((notif: UserNotification) => (
                    <motion.div
                      key={notif.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className={`relative border-b border-gray-200 py-2 px-2 ${
                        isInvoicePendingNotification(notif)
                          ? "border-l-4 border-l-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20"
                          : ""
                      } ${
                        !notif.read && !isInvoicePendingNotification(notif)
                          ? "bg-indigo-50 dark:bg-indigo-900/10 rounded"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isInvoicePendingNotification(notif) ? (
                            <DocumentTextIcon className="h-4 w-4 text-indigo-500" />
                          ) : null}
                          <h4 className="text-sm font-semibold">{notif.title}</h4>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityStyles(
                            notif.priority
                          )}`}
                        >
                          {getPriorityLabel(notif.priority)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-gray-100">
                        {formatNotificationBody(notif.body)}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        Módulo: {getModuleLabel(notif.module)}
                      </p>
                      {isInvoicePendingNotification(notif) ? (
                        <p className="mt-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                          Facturación pendiente
                        </p>
                      ) : null}
                      {!notif.read && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full absolute top-2 right-2" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 15 && (
              <div className="border-t border-gray-200 p-2 text-center">
                <p className="text-xs text-indigo-600 dark:text-indigo-300">
                  Mostrando las últimas 15 notificaciones
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
