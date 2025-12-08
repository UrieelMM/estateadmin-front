import React from "react";
import { Template } from "./TemplateSelector";

interface EmailPreviewProps {
  template: Template | null;
  htmlContent: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ template, htmlContent }) => {
  if (!template) {
    return (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center text-gray-500 dark:text-gray-400">
        <p>Selecciona un template para ver la previsualización</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Asunto: <span className="text-gray-900 dark:text-gray-100">{template.subject}</span>
        </h3>
      </div>
      <div className="p-6 bg-white">
        <div className="border border-gray-200 rounded-md overflow-hidden">
             <iframe
                srcDoc={htmlContent}
                title="Email Preview"
                className="w-full h-[600px]"
                style={{ border: "none" }}
             />
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
