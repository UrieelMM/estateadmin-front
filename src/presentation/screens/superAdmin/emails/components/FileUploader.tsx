import React, { useRef } from "react";
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Adjuntar Archivos
      </label>
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-1 text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
            <span className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              Sube un archivo
            </span>
            <p className="pl-1">o arrastra y suelta</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, PDF hasta 10MB
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
            >
              <div className="flex items-center">
                <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                  {file.name}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
