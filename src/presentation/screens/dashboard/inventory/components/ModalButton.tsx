import React from "react";

interface ModalButtonProps {
  onClick: () => void;
  text: string;
  icon?: string;
  className?: string;
}

const ModalButton: React.FC<ModalButtonProps> = ({
  onClick,
  text,
  icon = "fa-plus",
  className = "bg-indigo-600 hover:bg-indigo-700",
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Botón '${text}' clickeado`);

    // Timeout para asegurar que el evento se maneje correctamente
    setTimeout(() => {
      onClick();
    }, 10);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${className} text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center`}
    >
      {icon && <i className={`fas ${icon} mr-2`}></i>}
      {text}
    </button>
  );
};

export default ModalButton;
