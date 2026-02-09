import React, { useState, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import RecipientSelector from "./components/RecipientSelector";
import TemplateSelector, { Template } from "./components/TemplateSelector";
import EmailPreview from "./components/EmailPreview";
import FileUploader from "./components/FileUploader";
import TemplateEditor from "./components/TemplateEditor";
import { getWelcomeTemplate, WelcomeData } from "./templates/welcomeTemplate";
import { getMarketingTemplate, MarketingData } from "./templates/marketingTemplate";
import { getMaintenanceTemplate, MaintenanceData } from "./templates/maintenanceTemplate";

import { getCustomTemplate, CustomData } from "./templates/customTemplate";

import useSuperAdminStore from "../../../../store/superAdmin/SuperAdminStore";

const EmailManagement: React.FC = () => {
  const { clients } = useSuperAdminStore();
  const [recipientType, setRecipientType] = useState<"all" | "single" | "multiple">("all");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  // Dynamic Data State
  const [templateData, setTemplateData] = useState<any>({});

  // Initialize default data when template changes
  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate.id === "welcome") {
        setTemplateData({
          clientName: "{Nombre Cliente}",
          dashboardUrl: "https://estate-admin.com/login",
        } as WelcomeData);
      } else if (selectedTemplate.id === "marketing") {
        setTemplateData({
          title: "¡Nuevas Funcionalidades! ✨",
          subtitle: "Descubre lo que hemos preparado para ti",
          ctaText: "Probar Ahora",
          ctaUrl: "https://app.estateadmin.com/dashboard",
          blocks: [
            { id: "1", icon: "📊", title: "Reportes Financieros", content: "Visualiza el flujo de caja con gráficos interactivos." },
            { id: "2", icon: "📱", title: "App Móvil 2.0", content: "Una experiencia totalmente rediseñada para tus residentes." },
          ],
        } as MarketingData);
      } else if (selectedTemplate.id === "maintenance") {
        setTemplateData({
          date: "Domingo, 15 de Octubre",
          timeRange: "02:00 AM - 06:00 AM (CST)",
          duration: "Aprox. 4 horas",
          status: "Programado",
        } as MaintenanceData);
      } else if (selectedTemplate.id === "custom") {
        setTemplateData({
          htmlContent: "",
        } as CustomData);
      }
    }
  }, [selectedTemplate]);

  const getHtmlContent = () => {
    if (!selectedTemplate) return "";
    
    if (selectedTemplate.id === "welcome") {
      return getWelcomeTemplate(templateData as WelcomeData);
    } else if (selectedTemplate.id === "marketing") {
      return getMarketingTemplate(templateData as MarketingData);
    } else if (selectedTemplate.id === "maintenance") {
      return getMaintenanceTemplate(templateData as MaintenanceData);
    } else if (selectedTemplate.id === "custom") {
      return getCustomTemplate(templateData as CustomData);
    }
    return "";
  };

  const getSubject = () => {
    if (!selectedTemplate) return "";
    
    if (selectedTemplate.id === "welcome") return "Bienvenido a EstateAdmin";
    if (selectedTemplate.id === "marketing") return (templateData as MarketingData).title || "Novedades de EstateAdmin";
    if (selectedTemplate.id === "maintenance") return "Aviso de Mantenimiento";
    return "Notificación de EstateAdmin";
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      toast.error("Por favor selecciona un template");
      return;
    }

    if (recipientType !== "all" && selectedRecipients.length === 0) {
      toast.error("Por favor selecciona al menos un destinatario");
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      
      // 1. Recipients
      let recipientsValue: string | string[] = "all";
      
      if (recipientType !== "all") {
        // Map IDs to Emails
        recipientsValue = selectedRecipients
          .map(id => clients.find(c => c.id === id)?.email)
          .filter((email): email is string => !!email);
          
        if (recipientsValue.length === 0) {
           throw new Error("No se encontraron emails para los destinatarios seleccionados");
        }
      }

      formData.append("recipients", JSON.stringify(recipientsValue));

      // 2. Template ID - FORCE CUSTOM to use client-side HTML
      formData.append("templateId", "custom");

      // 3. Data - Send HTML and Subject
      const htmlContent = getHtmlContent();
      const subject = getSubject();
      
      formData.append("data", JSON.stringify({
        htmlContent,
        subject
      }));

      // 4. Files
      files.forEach((file) => {
        formData.append("files", file);
      });

      const serverUrl = import.meta.env.VITE_URL_SERVER_MARKETING;
      if (!serverUrl) {
        throw new Error("VITE_URL_SERVER_MARKETING is not defined");
      }

      const response = await fetch(`${serverUrl}/api/emails/send`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al enviar correos");
      }

      toast.success("Correos enviados exitosamente");
      
      // Reset form
      setFiles([]);
      setSelectedRecipients([]);
      setRecipientType("all");
      setSelectedTemplate(null);
      setTemplateData({});
    } catch (error: any) {
      console.error("Email send error:", error);
      toast.error(error.message || "Acción fallida");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Correos
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Envía correos masivos o personalizados a tus clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Configuración */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 border-gray-200 dark:border-gray-700">
              Configuración del Envío
            </h3>
            
            <RecipientSelector
              selectedRecipients={selectedRecipients}
              onChange={setSelectedRecipients}
              recipientType={recipientType}
              onTypeChange={setRecipientType}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Template
              </label>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </div>

            {selectedTemplate && (
              <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Personalizar Contenido
                </h4>
                <TemplateEditor
                  templateId={selectedTemplate.id}
                  data={templateData}
                  onChange={setTemplateData}
                />
              </div>
            )}

            <FileUploader files={files} onFilesChange={setFiles} />

            <div className="pt-4">
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  sending ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {sending ? (
                  "Enviando..."
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Enviar Correos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Previsualización */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Previsualización en tiempo real
          </h3>
          <div className="sticky top-6">
            <EmailPreview 
              template={selectedTemplate} 
              htmlContent={getHtmlContent()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;
