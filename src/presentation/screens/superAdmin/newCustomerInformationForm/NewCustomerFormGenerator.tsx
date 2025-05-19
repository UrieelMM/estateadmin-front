import React, { useState } from "react";
import {
  ClipboardIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import useNewCustomerFormStore from "../../../../store/superAdmin/useNewCustomerFormStore";
import toast from "react-hot-toast";

const NewCustomerFormGenerator: React.FC = () => {
  const { generateNewForm, generatedLink, isLoading, clearState } =
    useNewCustomerFormStore();
  const [copied, setCopied] = useState(false);

  const handleGenerateForm = async () => {
    // Genera un nuevo ID y registra el formulario en el backend
    await generateNewForm();
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");

      // Resetear el estado de copiado después de 3 segundos
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  const handleReset = () => {
    clearState();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Generación de Formularios para Nuevos Clientes
          </h2>
          {generatedLink && (
            <button
              onClick={handleReset}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Nuevo formulario
            </button>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none mb-6">
          <p>
            Genere enlaces a formularios para recopilar información de
            potenciales clientes. Estos formularios tienen validez de 7 días
            desde su creación y poseen un identificador único.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md mt-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Nota:</strong> Comparta estos enlaces únicamente con
              clientes potenciales. Los formularios expirarán automáticamente
              después de 7 días por razones de seguridad.
            </p>
          </div>
        </div>

        {!generatedLink ? (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleGenerateForm}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Generar Formulario
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enlace generado (válido por 7 días):
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {copied ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Instrucciones para uso:
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Copie el enlace generado usando el botón "Copiar".</li>
                <li>
                  Comparta el enlace con el cliente potencial vía correo
                  electrónico o mensaje.
                </li>
                <li>
                  Informe al cliente que dispone de 7 días para completar el
                  formulario.
                </li>
                <li>
                  Una vez completado, recibirá una notificación y podrá ver la
                  información en la sección de clientes.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCustomerFormGenerator;
