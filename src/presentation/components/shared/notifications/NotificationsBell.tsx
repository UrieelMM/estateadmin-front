// NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import useNotificationStore, { UserNotification } from '../../../../store/useNotificationsStore';
import { BellIcon } from '@heroicons/react/16/solid';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Obtiene las notificaciones al montar el componente
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Al abrir el dropdown, marca como leídas todas las notificaciones no leídas
  useEffect(() => {
    if (dropdownOpen) {
      notifications.forEach((notif: UserNotification) => {
        if (!notif.read) {
          markAsRead(notif.id);
        }
      });
    }
  }, [dropdownOpen, notifications, markAsRead]);

  // Mostrar solo las últimas 5 notificaciones
  const latestNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((notif: UserNotification) => !notif.read).length;

  // Función para formatear el monto en el body
  // Se asume que el body viene con el formato: "Monto: <amount>. Vence: <dueDate>. <optionalMessage>"
  const formatNotificationBody = (body: string): string => {
    const regex = /Monto:\s*([\d.,]+)\. Vence:\s*([^\.]+)\.?(.*)/;
    const match = body.match(regex);
    if (match) {
      const amountStr = match[1];
      // Se remueven comas y se parsea a número
      const parsedAmount = parseFloat(amountStr.replace(/,/g, ''));
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(parsedAmount);
      const dueDate = match[2].trim();
      const optionalMsg = match[3].trim();
      return `Monto: ${formattedAmount}. Vence: ${dueDate}. ${optionalMsg}`;
    }
    return body;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative focus:outline-none bg-white rounded-full p-1 "
      >
        <BellIcon className="h-[24px] w-[24px] text-indigo-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
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
              {latestNotifications.length === 0 ? (
                <p className="text-sm text-gray-900 dark:text-gray-100">No hay notificaciones.</p>
              ) : (
                latestNotifications.map((notif: UserNotification) => (
                  <motion.div
                    key={notif.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="border-b border-gray-200 py-2"
                  >
                    <h4 className="text-sm font-semibold">{notif.title}</h4>
                    <p className="text-xs text-gray-800 dark:text-gray-100">
                      {formatNotificationBody(notif.body)}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
