import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { CheckIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { useConfigStore } from "../../../../../store/useConfigStore";
import { useCondominiumStore } from "../../../../../store/useCondominiumStore";
import { useTheme } from "../../../../../context/Theme/ThemeContext";
import "react-quill/dist/quill.snow.css";
import "./quill-dark-mode.css";

const PaymentMessageEditor: React.FC = () => {
  const {
    paymentMessageInfo,
    updatePaymentMessageInfo,
    fetchPaymentMessageInfo,
  } = useConfigStore();
  const { isDarkMode } = useTheme();

  // Obtener el condominio seleccionado
  const selectedCondominium = useCondominiumStore(
    (state: any) => state.selectedCondominium
  );
  const [paymentMessage, setPaymentMessage] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [dueDay, setDueDay] = useState<number>(10);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Módulos de React-Quill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    fetchPaymentMessageInfo();
  }, [fetchPaymentMessageInfo]);

  useEffect(() => {
    if (paymentMessageInfo) {
      setBankAccount(paymentMessageInfo.bankAccount || "");
      setBankName(paymentMessageInfo.bankName || "");
      setDueDay(paymentMessageInfo.dueDay || 10);
      setPaymentMessage(
        paymentMessageInfo.paymentMessage || getDefaultMessage()
      );
    }
  }, [paymentMessageInfo]);

  // Actualizar el mensaje cuando cambien los valores de los inputs
  useEffect(() => {
    // Verificamos que el mensaje ya esté cargado antes de actualizarlo
    if (paymentMessage) {
      updateMessagePlaceholders();
    }
  }, [bankName, bankAccount, dueDay]);

  const getDefaultMessage = () => {
    return `<h3>Información de Pago</h3>
<p>Estimado residente,</p>
<p>Le recordamos que los pagos deben realizarse a más tardar el día ${dueDay} de cada mes.</p>
<p><strong>Datos bancarios:</strong></p>
<ul>
  <li>Banco: ${bankName || "[Nombre del Banco]"}</li>
  <li>Cuenta: ${bankAccount || "[Número de Cuenta]"}</li>
</ul>
<p>Si tiene alguna pregunta o requiere asistencia, favor de contactar a la administración.</p>
<p>Gracias por su puntualidad.</p>`;
  };

  const updateMessagePlaceholders = () => {
    // Reemplaza las variables en el mensaje con los valores actuales
    let updatedMessage = paymentMessage;

    // Actualizamos los placeholders con expresiones regulares más precisas
    // para no afectar texto que el usuario haya ingresado manualmente

    // Actualiza el nombre del banco
    const bankNameRegex = /Banco:\s*(?:\[Nombre del Banco\]|[^\n<]+)/g;
    if (updatedMessage.match(bankNameRegex)) {
      updatedMessage = updatedMessage.replace(
        bankNameRegex,
        `Banco: ${bankName || "[Nombre del Banco]"}`
      );
    }

    // Actualiza el número de cuenta
    const bankAccountRegex = /Cuenta:\s*(?:\[Número de Cuenta\]|[^\n<]+)/g;
    if (updatedMessage.match(bankAccountRegex)) {
      updatedMessage = updatedMessage.replace(
        bankAccountRegex,
        `Cuenta: ${bankAccount || "[Número de Cuenta]"}`
      );
    }

    // Actualiza el día de vencimiento en el mensaje
    const dueDayRegex = /a más tardar el día \d+ de/g;
    if (updatedMessage.match(dueDayRegex)) {
      updatedMessage = updatedMessage.replace(
        dueDayRegex,
        `a más tardar el día ${dueDay} de`
      );
    }

    setPaymentMessage(updatedMessage);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Actualizar el mensaje con los valores actuales
      updateMessagePlaceholders();

      // Guardar en la colección especializada a través del store
      await updatePaymentMessageInfo({
        bankAccount,
        bankName,
        dueDay,
        paymentMessage,
      });

      toast.success("Mensaje de pago actualizado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar el mensaje de pago");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="flex items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Mensaje de Pago Personalizado
        </h2>
        {selectedCondominium && (
          <span className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium dark:bg-indigo-900 dark:text-indigo-200">
            {selectedCondominium.name}
          </span>
        )}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4 mt-0">
        Configure el mensaje que verán los residentes sobre la información de
        pago de sus cuotas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Nombre del Banco */}
        <div>
          <label
            htmlFor="bankName"
            className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
          >
            Nombre del Banco
          </label>
          <input
            type="text"
            id="bankName"
            value={bankName}
            onChange={(e) => {
              setBankName(e.target.value);
            }}
            className="w-full px-3 h-[42px] border bg-transparent border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
            placeholder="Ej. BBVA"
          />
        </div>

        {/* Número de Cuenta */}
        <div>
          <label
            htmlFor="bankAccount"
            className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
          >
            Número de Cuenta
          </label>
          <input
            type="text"
            id="bankAccount"
            value={bankAccount}
            onChange={(e) => {
              setBankAccount(e.target.value);
            }}
            className="w-full px-3 h-[42px] border bg-transparent border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
            placeholder="Ej. 0123456789"
          />
        </div>

        {/* Día de vencimiento */}
        <div>
          <label
            htmlFor="dueDay"
            className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2"
          >
            Día límite de pago de cada mes
          </label>
          <div className="relative">
            <input
              type="number"
              id="dueDay"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => {
                setDueDay(parseInt(e.target.value) || 10);
              }}
              className="w-full px-3 h-[42px] border bg-transparent border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              de cada mes
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-900 dark:text-gray-100 text-sm font-bold mb-2">
          Mensaje Personalizado
        </label>
        <div className={`payment-editor-container ${isDarkMode ? "dark" : ""}`}>
          <ReactQuill
            theme="snow"
            value={paymentMessage}
            onChange={setPaymentMessage}
            modules={modules}
            className="min-h-[200px]"
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Personalice el mensaje que verán los residentes con la información de
          pago. Este mensaje se mostrará en los correos de cargos generados.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="animate-spin mr-2">&#8635;</span>
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-5 w-5 mr-2" />
              Guardar Mensaje
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentMessageEditor;
