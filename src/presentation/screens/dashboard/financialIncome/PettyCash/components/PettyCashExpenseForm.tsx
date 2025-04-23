import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import moment from "moment";
import "moment/locale/es"; // Importar localización en español
import {
  usePettyCashStore,
  PettyCashCategory,
  PettyCashTransactionType,
} from "../../../../../../store/pettyCashStore";

moment.locale("es"); // Establecer español como idioma

const PettyCashExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction, currentBalance, fetchConfig, fetchTransactions } =
    usePettyCashStore();

  // Estados para el formulario
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<PettyCashCategory | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [provider, setProvider] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      await fetchConfig();
      await fetchTransactions();
    };

    loadData();
  }, [fetchConfig, fetchTransactions]);

  // Lista de categorías para el selector
  const categories = [
    {
      id: PettyCashCategory.OFFICE_SUPPLIES,
      label: "Papelería y artículos de oficina",
    },
    { id: PettyCashCategory.CLEANING, label: "Limpieza" },
    { id: PettyCashCategory.MAINTENANCE, label: "Mantenimiento menor" },
    { id: PettyCashCategory.TRANSPORT, label: "Transporte y mensajería" },
    { id: PettyCashCategory.FOOD, label: "Alimentos y bebidas" },
    { id: PettyCashCategory.OTHER, label: "Otros gastos" },
  ];

  // Manejar carga de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Crear URL para previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Eliminar archivo
  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar campos
      if (!amount || !description || !date || !category) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("El monto debe ser un número mayor que cero");
      }

      if (amountValue > currentBalance) {
        throw new Error(
          `Saldo insuficiente en caja chica. Saldo actual: $${currentBalance.toFixed(
            2
          )}`
        );
      }

      // Crear transacción
      await addTransaction({
        type: PettyCashTransactionType.EXPENSE,
        amount: amountValue,
        category: category as PettyCashCategory,
        description,
        date: moment(date).format("YYYY-MM-DDTHH:mm:ss"),
        provider: provider || undefined,
        receiptFile: file || undefined,
      });

      // Limpiar formulario después de enviar
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(moment().format("YYYY-MM-DD"));
      setProvider("");
      setFile(null);
      setFilePreview(null);
      setSuccess(true);

      // Mostrar mensaje de éxito brevemente y luego navegar al dashboard
      setTimeout(() => {
        // Navegar al dashboard principal de caja chica
        navigate("/dashboard/pettycash", { replace: true });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Error al registrar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Registrar Gasto
            </h2>
            <button
              type="button"
              onClick={() => navigate("/dashboard/pettycash")}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Volver
            </button>
          </div>
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
              Saldo disponible:
            </span>
            <span
              className={`font-semibold ${
                currentBalance <= 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              $
              {currentBalance.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mensajes de éxito o error */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <p>Gasto registrado correctamente</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center">
            <XMarkIcon className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Monto (MXN) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0.01"
                max={currentBalance.toString()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Máximo disponible: ${currentBalance.toFixed(2)}
            </p>
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PettyCashCategory)}
              required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              placeholder="Describe el propósito del gasto"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fecha *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={moment().format("YYYY-MM-DD")}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="provider"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Proveedor o beneficiario
            </label>
            <input
              type="text"
              id="provider"
              name="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500  dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comprobante
            </label>
            {!filePreview ? (
              <div className="flex justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                <div className="space-y-2 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus-within:outline-none"
                    >
                      <span>Subir un archivo</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, PDF hasta 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                {file?.type.includes("image") ? (
                  <img
                    src={filePreview}
                    alt="Vista previa"
                    className="w-full h-48 object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-col items-center">
                      <ArrowUpTrayIcon className="h-10 w-10 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {file?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/dashboard/pettycash", { replace: true })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                Registrando...
              </>
            ) : (
              "Registrar Gasto"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PettyCashExpenseForm;
