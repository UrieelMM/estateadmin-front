import React from "react";

interface ModalButtonProps {
  onClick: () => void;
  text: string;
  icon?: string;
  className?: string;
}

const ModalButton: React.FC<ModalButtonProps> = ( {
  onClick,
  text,
  icon = "fa-plus",
  className = "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600",
} ) => {
  const handleClick = ( e: React.MouseEvent ) => {
    e.preventDefault();
    e.stopPropagation();

    // Timeout para asegurar que el evento se maneje correctamente
    setTimeout( () => {
      onClick();
    }, 10 );
  };

  return (
    <button
      type="button"
      onClick={ handleClick }
      className={ `${ className } text-white font-semibold rounded-xl text-sm px-5 py-2.5 inline-flex items-center gap-2 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200` }
    >
      { icon && (
        <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-lg">
          <i className={ `fas ${ icon } text-xs` } />
        </span>
      ) }
      { text }
    </button>
  );
};

export default ModalButton;
