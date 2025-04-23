import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  EnvelopeIcon,
  ServerIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

interface SystemSettings {
  allowUserRegistration: boolean;
  sessionTimeoutMinutes: number;
  maintenanceModeActive: boolean;
  maxFileUploadSizeMB: number;
  defaultCurrency: string;
  emailSettings: {
    senderName: string;
    senderEmail: string;
    smtpHost: string;
    smtpPort: number;
    enableSsl: boolean;
  };
  paymentGateways: {
    paypal: boolean;
    stripe: boolean;
    mercadoPago: boolean;
  };
  debugModeEnabled: boolean;
  lastUpdated: any; // Firestore timestamp
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        // En una implementación real, estos datos vendrían de Firestore
        // Aquí simulamos una carga de datos
        setTimeout(() => {
          setSettings({
            allowUserRegistration: true,
            sessionTimeoutMinutes: 60,
            maintenanceModeActive: false,
            maxFileUploadSizeMB: 10,
            defaultCurrency: "MXN",
            emailSettings: {
              senderName: "Estate Admin",
              senderEmail: "notificaciones@estateadmin.com",
              smtpHost: "smtp.estateadmin.com",
              smtpPort: 587,
              enableSsl: true,
            },
            paymentGateways: {
              paypal: true,
              stripe: true,
              mercadoPago: true,
            },
            debugModeEnabled: false,
            lastUpdated: { toDate: () => new Date("2024-03-15") },
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error al cargar configuración del sistema:", error);
        toast.error("Error al cargar la configuración del sistema");
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleBooleanChange = (field: string, value: boolean) => {
    if (!settings) return;

    const newSettings = { ...settings };

    // Handle nested fields
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "emailSettings") {
        newSettings.emailSettings = {
          ...newSettings.emailSettings,
          [child]: value,
        };
      } else if (parent === "paymentGateways") {
        newSettings.paymentGateways = {
          ...newSettings.paymentGateways,
          [child]: value,
        };
      }
    } else {
      // Handle top-level fields
      (newSettings as any)[field] = value;
    }

    setSettings(newSettings);
  };

  const handleNumberChange = (field: string, value: string) => {
    if (!settings) return;

    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) return;

    const newSettings = { ...settings };

    // Handle nested fields
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "emailSettings") {
        newSettings.emailSettings = {
          ...newSettings.emailSettings,
          [child]: parsedValue,
        };
      }
    } else {
      // Handle top-level fields
      (newSettings as any)[field] = parsedValue;
    }

    setSettings(newSettings);
  };

  const handleTextChange = (field: string, value: string) => {
    if (!settings) return;

    const newSettings = { ...settings };

    // Handle nested fields
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "emailSettings") {
        newSettings.emailSettings = {
          ...newSettings.emailSettings,
          [child]: value,
        };
      }
    } else {
      // Handle top-level fields
      (newSettings as any)[field] = value;
    }

    setSettings(newSettings);
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      // Simulación de guardado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Configuración General
                </h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="allowUserRegistration"
                        name="allowUserRegistration"
                        type="checkbox"
                        checked={settings.allowUserRegistration}
                        onChange={(e) =>
                          handleBooleanChange(
                            "allowUserRegistration",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="allowUserRegistration"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Permitir registro de nuevos usuarios
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Si está desactivado, solo los administradores pueden
                        crear nuevos usuarios.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="sessionTimeout"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Tiempo de expiración de sesión (minutos)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="sessionTimeout"
                        id="sessionTimeout"
                        min="5"
                        max="1440"
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) =>
                          handleNumberChange(
                            "sessionTimeoutMinutes",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Las sesiones expiran automáticamente después de este
                      tiempo de inactividad.
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="maintenanceModeActive"
                        name="maintenanceModeActive"
                        type="checkbox"
                        checked={settings.maintenanceModeActive}
                        onChange={(e) =>
                          handleBooleanChange(
                            "maintenanceModeActive",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="maintenanceModeActive"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Modo de mantenimiento
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Si está activado, solo los Super Administradores pueden
                        acceder al sistema.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="maxFileUploadSize"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Tamaño máximo de archivos (MB)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="maxFileUploadSize"
                        id="maxFileUploadSize"
                        min="1"
                        max="50"
                        value={settings.maxFileUploadSizeMB}
                        onChange={(e) =>
                          handleNumberChange(
                            "maxFileUploadSizeMB",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="defaultCurrency"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Moneda predeterminada
                    </label>
                    <select
                      id="defaultCurrency"
                      name="defaultCurrency"
                      value={settings.defaultCurrency}
                      onChange={(e) =>
                        handleTextChange("defaultCurrency", e.target.value)
                      }
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-gray-100"
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "email":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Configuración de Correo Electrónico
                </h3>
                <div className="mt-6 space-y-6">
                  <div>
                    <label
                      htmlFor="senderName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Nombre del Remitente
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="senderName"
                        id="senderName"
                        value={settings.emailSettings.senderName}
                        onChange={(e) =>
                          handleTextChange(
                            "emailSettings.senderName",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="senderEmail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Correo Electrónico del Remitente
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="senderEmail"
                        id="senderEmail"
                        value={settings.emailSettings.senderEmail}
                        onChange={(e) =>
                          handleTextChange(
                            "emailSettings.senderEmail",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="smtpHost"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Servidor SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpHost"
                        id="smtpHost"
                        value={settings.emailSettings.smtpHost}
                        onChange={(e) =>
                          handleTextChange(
                            "emailSettings.smtpHost",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="smtpPort"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Puerto SMTP
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="smtpPort"
                        id="smtpPort"
                        value={settings.emailSettings.smtpPort}
                        onChange={(e) =>
                          handleNumberChange(
                            "emailSettings.smtpPort",
                            e.target.value
                          )
                        }
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableSsl"
                        name="enableSsl"
                        type="checkbox"
                        checked={settings.emailSettings.enableSsl}
                        onChange={(e) =>
                          handleBooleanChange(
                            "emailSettings.enableSsl",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="enableSsl"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Usar SSL/TLS
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Habilita la conexión segura para el servidor SMTP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "payment":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Configuración de Pasarelas de Pago
                </h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enablePaypal"
                        name="enablePaypal"
                        type="checkbox"
                        checked={settings.paymentGateways.paypal}
                        onChange={(e) =>
                          handleBooleanChange(
                            "paymentGateways.paypal",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="enablePaypal"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Habilitar PayPal
                      </label>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableStripe"
                        name="enableStripe"
                        type="checkbox"
                        checked={settings.paymentGateways.stripe}
                        onChange={(e) =>
                          handleBooleanChange(
                            "paymentGateways.stripe",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="enableStripe"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Habilitar Stripe
                      </label>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="enableMercadoPago"
                        name="enableMercadoPago"
                        type="checkbox"
                        checked={settings.paymentGateways.mercadoPago}
                        onChange={(e) =>
                          handleBooleanChange(
                            "paymentGateways.mercadoPago",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="enableMercadoPago"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Habilitar Mercado Pago
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "system":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  Configuración del Sistema
                </h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="debugModeEnabled"
                        name="debugModeEnabled"
                        type="checkbox"
                        checked={settings.debugModeEnabled}
                        onChange={(e) =>
                          handleBooleanChange(
                            "debugModeEnabled",
                            e.target.checked
                          )
                        }
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="debugModeEnabled"
                        className="font-medium text-gray-700 dark:text-gray-300"
                      >
                        Habilitar Modo Debug
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Genera logs adicionales para depuración. No se
                        recomienda en producción.
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Zona de precaución
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <p>
                            Los cambios en esta sección podrían afectar la
                            operación del sistema.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Configuración del Sistema
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra la configuración global de la plataforma
        </p>
        {settings?.lastUpdated && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Última actualización:{" "}
            {settings.lastUpdated.toDate().toLocaleString("es-ES")}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("general")}
              className={`${
                activeTab === "general"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Cog6ToothIcon className="mr-2 h-5 w-5" />
              General
            </button>

            <button
              onClick={() => setActiveTab("email")}
              className={`${
                activeTab === "email"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <EnvelopeIcon className="mr-2 h-5 w-5" />
              Correo Electrónico
            </button>

            <button
              onClick={() => setActiveTab("payment")}
              className={`${
                activeTab === "payment"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <CurrencyDollarIcon className="mr-2 h-5 w-5" />
              Pasarelas de Pago
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`${
                activeTab === "system"
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <ServerIcon className="mr-2 h-5 w-5" />
              Sistema
            </button>
          </nav>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {renderTabContent()}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || !settings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
