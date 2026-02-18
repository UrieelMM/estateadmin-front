import React from "react";
import { ItemType } from "../../../../../store/inventoryStore";

interface TypeBadgeProps {
  type: ItemType;
}

const badgeStyle: Record<ItemType, string> = {
  [ ItemType.SUPPLIES ]: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800",
  [ ItemType.MACHINERY ]: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600",
  [ ItemType.TOOL ]: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800",
  [ ItemType.MATERIAL ]: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800",
};

const badgeIcon: Record<ItemType, string> = {
  [ ItemType.SUPPLIES ]: "fa-box",
  [ ItemType.MACHINERY ]: "fa-cogs",
  [ ItemType.TOOL ]: "fa-wrench",
  [ ItemType.MATERIAL ]: "fa-cubes",
};

const badgeLabel: Record<ItemType, string> = {
  [ ItemType.SUPPLIES ]: "Insumo",
  [ ItemType.MACHINERY ]: "Maquinaria",
  [ ItemType.TOOL ]: "Herramienta",
  [ ItemType.MATERIAL ]: "Material",
};

const TypeBadge: React.FC<TypeBadgeProps> = ( { type } ) => (
  <span className={ `inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${ badgeStyle[ type ] }` }>
    <i className={ `fas ${ badgeIcon[ type ] } text-[10px]` } />
    { badgeLabel[ type ] }
  </span>
);

export default TypeBadge;
