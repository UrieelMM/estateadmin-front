import React from "react";
import { ItemStatus } from "../../../../../store/inventoryStore";

interface StatusBadgeProps {
  status: ItemStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeStyle = {
    [ItemStatus.ACTIVE]:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [ItemStatus.INACTIVE]:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    [ItemStatus.MAINTENANCE]:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    [ItemStatus.DISCONTINUED]:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const badgeIcon = {
    [ItemStatus.ACTIVE]: "fa-check-circle",
    [ItemStatus.INACTIVE]: "fa-ban",
    [ItemStatus.MAINTENANCE]: "fa-wrench",
    [ItemStatus.DISCONTINUED]: "fa-archive",
  };

  const badgeLabel = {
    [ItemStatus.ACTIVE]: "Activo",
    [ItemStatus.INACTIVE]: "Inactivo",
    [ItemStatus.MAINTENANCE]: "En mantenimiento",
    [ItemStatus.DISCONTINUED]: "Descontinuado",
  };

  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center ${badgeStyle[status]}`}
    >
      <i className={`fas ${badgeIcon[status]} mr-1`}></i>
      {badgeLabel[status]}
    </span>
  );
};

export default StatusBadge;
