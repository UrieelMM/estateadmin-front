import React from "react";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
}

const templates: Template[] = [
  {
    id: "welcome",
    name: "Bienvenida",
    description: "Correo de bienvenida para nuevos clientes.",
    subject: "¡Bienvenido a EstateAdmin!",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Promoción de nuevas funcionalidades.",
    subject: "Descubre lo nuevo en EstateAdmin",
  },
  {
    id: "maintenance",
    name: "Mantenimiento",
    description: "Aviso de mantenimiento programado.",
    subject: "Aviso de Mantenimiento",
  },
  {
    id: "custom",
    name: "Custom HTML",
    description: "Pega tu propio código HTML.",
    subject: "Asunto Personalizado",
  },
];

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelect: (template: Template) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelect,
}) => {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-md">
        <RadioGroup value={selectedTemplate} onChange={onSelect}>
          <RadioGroup.Label className="sr-only">Server size</RadioGroup.Label>
          <div className="space-y-2">
            {templates.map((template) => (
              <RadioGroup.Option
                key={template.id}
                value={template}
                className={({ active, checked }) =>
                  `${
                    active
                      ? "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-300"
                      : ""
                  }
                  ${
                    checked ? "bg-indigo-900 bg-opacity-75 text-white" : "bg-white dark:bg-gray-800"
                  }
                    relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                }
              >
                {({ checked }) => (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <RadioGroup.Label
                            as="p"
                            className={`font-medium  ${
                              checked ? "text-white" : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {template.name}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="span"
                            className={`inline ${
                              checked ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {template.description}
                          </RadioGroup.Description>
                        </div>
                      </div>
                      {checked && (
                        <div className="shrink-0 text-white">
                          <CheckCircleIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default TemplateSelector;
