import React from "react";
import { ItemStatus } from "../../../../../store/inventoryStore";

interface StatusBadgeProps {
  status: ItemStatus;
}

const badgeStyle: Record<ItemStatus, string> = {
  [ ItemStatus.ACTIVE ]: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
  [ ItemStatus.INACTIVE ]: "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:ring-gray-600",
  [ ItemStatus.MAINTENANCE ]: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  [ ItemStatus.DISCONTINUED ]: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800",
};

const badgeDot: Record<ItemStatus, string> = {
  [ ItemStatus.ACTIVE ]: "bg-emerald-500 animate-pulse",
  [ ItemStatus.INACTIVE ]: "bg-gray-400",
  [ ItemStatus.MAINTENANCE ]: "bg-amber-500",
  [ ItemStatus.DISCONTINUED ]: "bg-red-500",
};

const badgeLabel: Record<ItemStatus, string> = {
  [ ItemStatus.ACTIVE ]: "Activo",
  [ ItemStatus.INACTIVE ]: "Inactivo",
  [ ItemStatus.MAINTENANCE ]: "Mantenimiento",
  [ ItemStatus.DISCONTINUED ]: "Descontinuado",
};

const StatusBadge: React.FC<StatusBadgeProps> = ( { status } ) => (
  <span className={ `inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ badgeStyle[ status ] }` }>
    <span className={ `w-1.5 h-1.5 rounded-full flex-shrink-0 ${ badgeDot[ status ] }` } />
    { badgeLabel[ status ] }
  </span>
);

export default StatusBadge;
