import React from "react";
import { ItemType } from "../../../../../store/inventoryStore";

interface TypeBadgeProps {
  type: ItemType;
}

const badgeStyle: Record<ItemType, string> = {
  [ ItemType.SUPPLIES ]: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:ring-sky-800",
  [ ItemType.MACHINERY ]: "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-800",
  [ ItemType.TOOL ]: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-800",
  [ ItemType.MATERIAL ]: "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-800",
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
