import React from "react";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  title,
  isOpen,
  onClose,
  size = "md",
  children,
}) => {
  // Mapeo de tamaños
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-100 bg-opacity-20 dark:bg-indigo-100 dark:bg-opacity-20"
      onClick={() => onClose()}
    >
      <div
        className={`${sizeClasses[size]} w-full dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b dark:border-gray-700 p-4">
          <h3
            id="modal-title"
            className="text-xl font-medium text-gray-600 dark:text-gray-100"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100"
            aria-label="Cerrar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
