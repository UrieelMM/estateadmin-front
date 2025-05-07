import React, { useEffect, useRef } from "react";

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
  const modalRef = useRef<HTMLDivElement>(null);

  // Añadir evento para cerrar modal con Escape
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Mapeo de tamaños
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  if (!isOpen) return null;

  // Cierra el modal cuando se hace clic en el overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-60 backdrop-blur-sm transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b dark:border-gray-700 p-4">
          <h3
            id="modal-title"
            className="text-xl font-medium text-gray-800 dark:text-gray-100"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
