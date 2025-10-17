import React from "react";
import { ItemType } from "../../../../../store/inventoryStore";

interface TypeBadgeProps {
  type: ItemType;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const badgeStyle = {
    [ItemType.SUPPLIES]:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    [ItemType.MACHINERY]:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    [ItemType.TOOL]:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    [ItemType.MATERIAL]:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };

  const badgeIcon = {
    [ItemType.SUPPLIES]: "fa-box",
    [ItemType.MACHINERY]: "fa-cogs",
    [ItemType.TOOL]: "fa-wrench",
    [ItemType.MATERIAL]: "fa-cubes",
  };

  const badgeLabel = {
    [ItemType.SUPPLIES]: "Insumo",
    [ItemType.MACHINERY]: "Maquinaria",
    [ItemType.TOOL]: "Herramienta",
    [ItemType.MATERIAL]: "Material",
  };

  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center ${badgeStyle[type]}`}
    >
      <i className={`fas ${badgeIcon[type]} mr-1`}></i>
      {badgeLabel[type]}
    </span>
  );
};

export default TypeBadge;
