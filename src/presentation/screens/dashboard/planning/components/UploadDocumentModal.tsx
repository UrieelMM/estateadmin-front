import React, { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import { usePlanningStore } from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planningId: string;
  taskId?: string;
  onSuccess?: (documentId: string) => void;
}

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  planningId,
  taskId,
  onSuccess,
}) => {
  const { uploadDocument, loading, error } = usePlanningStore();
  const { user } = useUserDataStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    file?: string;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const errors: { title?: string; file?: string } = {};
    let isValid = true;

    if (!title.trim()) {
      errors.title = "El título es requerido";
      isValid = false;
    }

    if (!file) {
      errors.file = "Debe seleccionar un archivo";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsUploading(true);

    try {
      const documentData = {
        planningId,
        title,
        description,
        file,
        taskId,
        uploadedBy: user?.uid || "",
        uploadedAt: new Date(),
      };

      const documentId = await uploadDocument(documentData);

      if (documentId && onSuccess) {
        onSuccess(documentId);
      }

      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
            Subir Documento
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.title ? "border-red-500 dark:border-red-500" : ""
                }`}
                placeholder="Título del documento"
                required
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.title}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                  formErrors.description
                    ? "border-red-500 dark:border-red-500"
                    : ""
                }`}
                placeholder="Descripción opcional del documento"
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="file"
                className="mb-2 block font-medium text-gray-700 dark:text-gray-200"
              >
                Archivo
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        Haga clic para cargar
                      </span>{" "}
                      o arrastre y suelte
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOCX, XLSX, JPG, PNG (MAX. 10MB)
                    </p>
                    {file && (
                      <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {file.name}
                      </p>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {formErrors.file && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.file}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isUploading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading || isUploading ? (
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
                    Subiendo...
                  </>
                ) : (
                  "Subir Documento"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
