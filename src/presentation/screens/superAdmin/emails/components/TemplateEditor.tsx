import React from "react";
import { WelcomeData } from "../templates/welcomeTemplate";
import { MarketingData, MarketingBlock } from "../templates/marketingTemplate";
import { MaintenanceData } from "../templates/maintenanceTemplate";
import { CustomData } from "../templates/customTemplate";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface TemplateEditorProps {
  templateId: string;
  data: any;
  onChange: (data: any) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateId,
  data,
  onChange,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  if (templateId === "welcome") {
    const welcomeData = data as WelcomeData;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del Cliente (Variable)
          </label>
          <input
            type="text"
            value={welcomeData.clientName}
            onChange={(e) => handleChange("clientName", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="{clientName}"
          />
          <p className="mt-1 text-xs text-gray-500">
            Este valor se reemplazará automáticamente con el nombre de cada cliente.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL del Dashboard
          </label>
          <input
            type="text"
            value={welcomeData.dashboardUrl}
            onChange={(e) => handleChange("dashboardUrl", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
    );
  }

  if (templateId === "marketing") {
    const marketingData = data as MarketingData;

    const handleBlockChange = (index: number, field: keyof MarketingBlock, value: string) => {
      const newBlocks = [...marketingData.blocks];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      handleChange("blocks", newBlocks);
    };

    const addBlock = () => {
      const newBlock: MarketingBlock = {
        id: Date.now().toString(),
        icon: "✨",
        title: "Nuevo Bloque",
        content: "Descripción del nuevo bloque.",
      };
      handleChange("blocks", [...marketingData.blocks, newBlock]);
    };

    const removeBlock = (index: number) => {
      const newBlocks = marketingData.blocks.filter((_, i) => i !== index);
      handleChange("blocks", newBlocks);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Título Principal
            </label>
            <input
              type="text"
              value={marketingData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subtítulo
            </label>
            <input
              type="text"
              value={marketingData.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Bloques de Contenido</h4>
            <button
              onClick={addBlock}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Bloque
            </button>
          </div>
          
          <div className="space-y-4">
            {(marketingData.blocks || []).map((block, index) => (
              <div key={block.id} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 relative">
                <button
                  onClick={() => removeBlock(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500">Icono</label>
                    <input
                      type="text"
                      value={block.icon}
                      onChange={(e) => handleBlockChange(index, "icon", e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-500">Título</label>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => handleBlockChange(index, "title", e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Contenido</label>
                  <textarea
                    rows={2}
                    value={block.content}
                    onChange={(e) => handleBlockChange(index, "content", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto del Botón
            </label>
            <input
              type="text"
              value={marketingData.ctaText}
              onChange={(e) => handleChange("ctaText", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL del Botón
            </label>
            <input
              type="text"
              value={marketingData.ctaUrl}
              onChange={(e) => handleChange("ctaUrl", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === "maintenance") {
    const maintenanceData = data as MaintenanceData;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Estado
          </label>
          <select
            value={maintenanceData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Programado">Programado</option>
            <option value="En Progreso">En Progreso</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha
          </label>
          <input
            type="text"
            value={maintenanceData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: Domingo, 15 de Octubre"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Horario
          </label>
          <input
            type="text"
            value={maintenanceData.timeRange}
            onChange={(e) => handleChange("timeRange", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: 02:00 AM - 06:00 AM (CST)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duración Estimada
          </label>
          <input
            type="text"
            value={maintenanceData.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: Aprox. 4 horas"
          />
        </div>
      </div>
    );
  }

  if (templateId === "custom") {
    const customData = data as CustomData;
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Código HTML
          </label>
          <div className="mt-1">
            <textarea
              rows={15}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="<html>...</html>"
              value={customData.htmlContent}
              onChange={(e) => handleChange("htmlContent", e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Pega aquí tu código HTML completo. Asegúrate de incluir estilos en línea o en una etiqueta &lt;style&gt;.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default TemplateEditor;
