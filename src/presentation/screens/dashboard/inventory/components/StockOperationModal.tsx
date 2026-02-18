import React, { useState } from "react";
import { InventoryItem } from "../../../../../store/inventoryStore";

interface StockOperationModalProps {
  title: string;
  item: InventoryItem;
  onSubmit: ( quantity: number, notes?: string ) => void;
  onCancel: () => void;
  loading: boolean;
  operation: "add" | "consume";
  maxQuantity?: number;
}

const StockOperationModal: React.FC<StockOperationModalProps> = ( {
  title,
  item,
  onSubmit,
  onCancel,
  loading,
  operation,
  maxQuantity,
} ) => {
  const [ quantity, setQuantity ] = useState<number>( 1 );
  const [ notes, setNotes ] = useState<string>( "" );
  const [ error, setError ] = useState<string>( "" );

  const handleSubmit = ( e: React.FormEvent ) => {
    e.preventDefault();

    // Validaciones
    if ( quantity <= 0 ) {
      setError( "La cantidad debe ser mayor a 0" );
      return;
    }

    if (
      operation === "consume" &&
      maxQuantity !== undefined &&
      quantity > maxQuantity
    ) {
      setError(
        `No hay suficiente stock. El máximo disponible es ${ maxQuantity }`
      );
      return;
    }

    onSubmit( quantity, notes.trim() !== "" ? notes : undefined );
  };

  const handleQuantityChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
    const value = parseInt( e.target.value );
    setQuantity( isNaN( value ) ? 0 : value );
    setError( "" );
  };

  const isAdd = operation === "add";

  return (
    <div className="p-6">
      {/* Header visual */ }
      <div className="flex flex-col items-center mb-6">
        <div className={ `w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${ isAdd
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
            : "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30"
          }` }>
          <i className={ `fas ${ isAdd ? "fa-plus" : "fa-minus" } text-3xl text-white` } />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{ title }</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          { isAdd ? "Añadir stock al ítem:" : "Consumir stock del ítem:" }
        </p>
        <div className="mt-3 px-4 py-2 bg-gray-50 dark:bg-gray-700/60 rounded-xl text-center">
          <p className="font-bold text-gray-800 dark:text-white">{ item.name }</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Stock actual:{ " " }
            <span className="font-semibold text-gray-700 dark:text-gray-300">{ item.stock }</span>
          </p>
        </div>
      </div>

      <form onSubmit={ handleSubmit } className="space-y-4">
        {/* Cantidad */ }
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Cantidad
          </label>
          <input
            type="number"
            value={ quantity }
            onChange={ handleQuantityChange }
            min="1"
            max={ operation === "consume" ? maxQuantity : undefined }
            className={ `w-full bg-gray-50 dark:bg-gray-700/60 border ${ error ? "border-red-400 focus:ring-red-500" : "border-gray-200 dark:border-gray-600 focus:ring-indigo-500"
              } text-gray-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:border-transparent p-3 transition-all` }
            placeholder="Cantidad"
          />
          { error && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <i className="fas fa-exclamation-circle" />
              { error }
            </p>
          ) }
        </div>

        {/* Notas */ }
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            rows={ 3 }
            value={ notes }
            onChange={ ( e ) => setNotes( e.target.value ) }
            className="w-full bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent p-3 transition-all resize-none"
            placeholder="Agregar notas sobre esta operación..."
          />
        </div>

        {/* Acciones */ }
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={ onCancel }
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-60"
            disabled={ loading }
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={ loading }
            className={ `px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed ${ isAdd
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30"
              }` }
          >
            { loading ? (
              <span className="flex items-center gap-2">
                <i className="fas fa-spinner fa-spin" />
                { isAdd ? "Añadiendo..." : "Consumiendo..." }
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <i className={ `fas ${ isAdd ? "fa-plus-circle" : "fa-minus-circle" }` } />
                { isAdd ? "Añadir stock" : "Consumir stock" }
              </span>
            ) }
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockOperationModal;
