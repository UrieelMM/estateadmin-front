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

  const icons = {
    add: "fa-plus-circle",
    consume: "fa-minus-circle",
  };

  const colors = {
    add: "bg-green-600 hover:bg-green-700",
    consume: "bg-yellow-600 hover:bg-yellow-700",
  };

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <i
            className={ `fas ${ icons[ operation ] } text-2xl ${ operation === "add" ? "text-green-500" : "text-yellow-500"
              }` }
          ></i>
        </div>
        <h3 className="text-xl font-medium text-gray-800 dark:text-white">{ title }</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          { operation === "add"
            ? "Añadir stock al ítem:"
            : "Consumir stock del ítem:" }
        </p>
        <div className="font-bold text-lg text-gray-800 dark:text-white mt-2">{ item.name }</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Stock actual: { item.stock }
        </div>
      </div>

      <form onSubmit={ handleSubmit } className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            value={ quantity }
            onChange={ handleQuantityChange }
            min="1"
            max={ operation === "consume" ? maxQuantity : undefined }
            className={ `bg-white dark:bg-gray-700 border ${ error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5` }
            placeholder="Cantidad"
          />
          { error && <p className="mt-1 text-sm text-red-500">{ error }</p> }
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas (opcional)
          </label>
          <textarea
            rows={ 3 }
            value={ notes }
            onChange={ ( e ) => setNotes( e.target.value ) }
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="Agregar notas sobre esta operación..."
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={ onCancel }
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            disabled={ loading }
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={ loading }
            className={ `px-4 py-2 ${ colors[ operation ] } text-white text-sm font-medium rounded-lg disabled:opacity-70 disabled:cursor-not-allowed` }
          >
            { loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                { operation === "add" ? "Añadiendo..." : "Consumiendo..." }
              </>
            ) : (
              <>
                <i className={ `fas ${ icons[ operation ] } mr-2` }></i>
                { operation === "add" ? "Añadir stock" : "Consumir stock" }
              </>
            ) }
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockOperationModal;
