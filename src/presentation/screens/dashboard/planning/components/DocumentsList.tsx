import React, { useState, useEffect } from "react";
import {
  PlanningDocument,
  usePlanningStore,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";
import moment from "moment";
import "moment/locale/es";
import {
  DocumentIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  PhotoIcon,
  MusicalNoteIcon,
  FilmIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ConfirmModal from "./ConfirmModal";

interface DocumentsListProps {
  documents: PlanningDocument[];
  planningId: string;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ documents }) => {
  const { getUserById } = useUserDataStore();
  const { deleteDocument } = usePlanningStore();
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  useEffect(() => {
    // Cargar datos de usuarios para los documentos
    const loadUserData = async () => {
      const userIds = [...new Set(documents.map((doc) => doc.uploadedBy))];
      const newCache: Record<string, any> = {};

      for (const userId of userIds) {
        if (!userCache[userId]) {
          const userData = await getUserById(userId);
          if (userData) {
            newCache[userId] = userData;
          }
        }
      }

      setUserCache((prev) => ({ ...prev, ...newCache }));
    };

    loadUserData();
  }, [documents, getUserById, userCache]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <PhotoIcon className="h-6 w-6 text-pink-500" aria-hidden="true" />;
    } else if (fileType.startsWith("application/pdf")) {
      return (
        <DocumentTextIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
      );
    } else if (
      fileType.startsWith("application/vnd.ms-excel") ||
      fileType.startsWith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml"
      )
    ) {
      return (
        <DocumentChartBarIcon
          className="h-6 w-6 text-green-500"
          aria-hidden="true"
        />
      );
    } else if (fileType.startsWith("audio/")) {
      return (
        <MusicalNoteIcon
          className="h-6 w-6 text-purple-500"
          aria-hidden="true"
        />
      );
    } else if (fileType.startsWith("video/")) {
      return <FilmIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />;
    } else {
      return (
        <DocumentIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDeleteDocument = async () => {
    if (deleteDocumentId) {
      await deleteDocument(deleteDocumentId);
      setDeleteDocumentId(null);
    }
  };

  const handleDownload = (document: PlanningDocument) => {
    window.open(document.fileUrl, "_blank");
  };

  if (!documents.length) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No hay documentos
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sube documentos para compartirlos con el equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <li
            key={document.id}
            className="col-span-1 bg-white dark:bg-gray-700 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-600"
          >
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex-1 flex items-center truncate">
                {getFileIcon(document.fileType)}
                <div className="flex-1 px-4 py-2 truncate">
                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary"
                  >
                    {document.name}
                  </a>
                  {document.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {document.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="-mt-px flex divide-x divide-gray-200 dark:divide-gray-600">
                <div className="w-0 flex-1 flex">
                  <button
                    onClick={() => handleDownload(document)}
                    className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 dark:text-gray-300 font-medium border border-transparent rounded-bl-lg hover:text-primary"
                  >
                    <ArrowDownTrayIcon
                      className="w-5 h-5 text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                    <span className="ml-2">Descargar</span>
                  </button>
                </div>
                <div className="-ml-px w-0 flex-1 flex">
                  <button
                    onClick={() => setDeleteDocumentId(document.id)}
                    className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 dark:text-gray-300 font-medium border border-transparent rounded-br-lg hover:text-red-500"
                  >
                    <TrashIcon
                      className="w-5 h-5 text-gray-400 dark:text-gray-500"
                      aria-hidden="true"
                    />
                    <span className="ml-2">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
              <p>
                Subido por: {userCache[document.uploadedBy]?.name || "Usuario"}
              </p>
              <p>Tamaño: {formatFileSize(document.fileSize)}</p>
              <p>Subido: {moment(document.uploadedAt).fromNow()}</p>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        isOpen={!!deleteDocumentId}
        title="Eliminar documento"
        message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
        onConfirm={handleDeleteDocument}
        onCancel={() => setDeleteDocumentId(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default DocumentsList;
