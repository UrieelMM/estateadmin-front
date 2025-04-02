// NotificationBell.tsx
import React, { useState, useEffect } from "react";
import useNotificationStore, {
  UserNotification,
} from "../../../../store/useNotificationsStore";
import { BellIcon } from "@heroicons/react/16/solid";
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
  const { notifications, fetchNotifications, markAsRead } =
    useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtiene las notificaciones al montar el componente
  useEffect(() => {
    console.log("NotificationBell: Montando componente");
    const loadNotifications = async () => {
      setLoading(true);
      try {
        console.log("NotificationBell: Iniciando carga de notificaciones");
        await fetchNotifications();
        console.log("NotificationBell: Notificaciones cargadas");
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
    const markAllAsRead = async () => {
      if (dropdownOpen && notifications.length > 0) {
        console.log(
          "Marcando notificaciones como leídas:",
          notifications.filter((n) => !n.read).length
        );

        // Marcamos notificaciones una por una
        for (const notif of notifications) {
          if (!notif.read) {
            await markAsRead(notif.id);
          }
        }
      }
    };

    markAllAsRead();
  }, [dropdownOpen, notifications, markAsRead]);

  // Mostrar solo las últimas 5 notificaciones
  const latestNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter(
    (notif: UserNotification) => !notif.read
  ).length;

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

  // Debug para ver el estado de notificaciones en cada renderizado
  console.log("NotificationBell render:", {
    notificationsCount: notifications.length,
    unreadCount,
    isDropdownOpen: dropdownOpen,
    isLoading: loading,
  });

  return (
    <div className="relative">
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
                latestNotifications.map((notif: UserNotification) => (
                  <motion.div
                    key={notif.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className={`border-b border-gray-200 py-2 ${
                      !notif.read
                        ? "bg-indigo-50 dark:bg-indigo-900/10 rounded"
                        : ""
                    }`}
                  >
                    <h4 className="text-sm font-semibold">{notif.title}</h4>
                    <p className="text-xs text-gray-800 dark:text-gray-100">
                      {formatNotificationBody(notif.body)}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full absolute top-2 right-2" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
            {notifications.length > 5 && (
              <div className="border-t border-gray-200 p-2 text-center">
                <button className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
