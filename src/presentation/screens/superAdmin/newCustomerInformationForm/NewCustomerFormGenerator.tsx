import React, { useState } from "react";
import {
  ClipboardIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
  LinkIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import useNewCustomerFormStore from "../../../../store/superAdmin/useNewCustomerFormStore";
import toast from "react-hot-toast";

const NewCustomerFormGenerator: React.FC = () => {
  const { generateNewForm, generatedLink, isLoading, clearState } =
    useNewCustomerFormStore();
  const [copied, setCopied] = useState(false);

  const handleGenerateForm = async () => {
    try {
      await generateNewForm();
    } catch (_error) {
      toast.error("No fue posible generar el formulario. Intenta nuevamente.");
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (_error) {
      toast.error("No se pudo copiar el enlace. Cópialo manualmente.");
    }
  };

  const handleReset = () => {
    clearState();
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 md:p-8">
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 md:p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generación de Formularios para Nuevos Clientes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Crea un enlace único para onboarding comercial y compártelo con
                el prospecto.
              </p>
            </div>
            {generatedLink && (
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-indigo-200 dark:border-indigo-700 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Nuevo formulario
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Enlace único
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cada formulario tiene identificador exclusivo.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Vigencia de 7 días
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Expira automáticamente por seguridad operativa.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Uso controlado
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Comparte solo con clientes potenciales validados.
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-6">
          <p>
            Genera enlaces a formularios para recopilar información de
            potenciales clientes. Estos formularios tienen validez de 7 días
            desde su creación y poseen un identificador único.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50 p-4 rounded-xl mt-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Nota:</strong> Comparta estos enlaces únicamente con
              clientes potenciales. Los formularios expirarán automáticamente
              después de 7 días por razones de seguridad.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Flujo de trabajo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tiempo estimado: 1 minuto
            </p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <li className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
              1. Genera el enlace.
            </li>
            <li className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
              2. Compártelo al prospecto.
            </li>
            <li className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
              3. Recibe el formulario completo.
            </li>
            <li className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5">
              4. Da seguimiento comercial.
            </li>
          </ol>
        </div>

        {!generatedLink ? (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleGenerateForm}
              disabled={isLoading}
              className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
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
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enlace generado (válido por 7 días):
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="inline-flex justify-center items-center px-3 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCustomerFormGenerator;
