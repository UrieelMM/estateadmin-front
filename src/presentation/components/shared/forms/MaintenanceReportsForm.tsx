import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { useDropzone } from "react-dropzone";
import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import {
  MaintenanceReport,
  useMaintenanceReportStore,
} from "../../../../store/useMaintenanceStore";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";
import { useFileCompression } from "../../../../hooks/useFileCompression";

interface MaintenanceReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MaintenanceReport;
}

// Opciones de área para un condominio de departamentos
const areaOptions = [
  "Lobby",
  "Recepción",
  "Vestíbulo",
  "Pasillos",
  "Ascensores",
  "Escaleras",
  "Garaje",
  "Zonas Verdes",
  "Área de Juegos",
  "Piscina",
  "Gimnasio",
  "Sauna",
  "Terraza",
  "Azotea",
  "Baños Comunes",
  "Salón de Eventos",
  "Cocina Comunal",
  "Jardín",
  "Estacionamiento",
  "Área de Barbacoa",
  "Cuarto de Basura",
  "Mantenimiento General",
  "Sistemas Eléctricos",
  "Plomería",
  "Administración",
];

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "color",
  "background",
  "link",
];

const MaintenanceReportForm: React.FC<MaintenanceReportFormProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { createReport, updateReport } = useMaintenanceReportStore();
  const { compressFile, isCompressing } = useFileCompression();

  const [fecha, setFecha] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [encargado, setEncargado] = useState<string>("");
  const [detalle, setDetalle] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      // Convertir la fecha al formato yyyy-mm-dd para el input date
      const dateObj = new Date(initialData.fecha);
      const year = dateObj.getFullYear();
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const day = ("0" + dateObj.getDate()).slice(-2);
      setFecha(`${year}-${month}-${day}`);
      setArea(initialData.area);
      setEncargado(initialData.encargado);
      setDetalle(initialData.detalle);
      setFile(null);
      setFileName("");
    } else {
      setFecha("");
      setArea("");
      setEncargado("");
      setDetalle("");
      setFile(null);
      setFileName("");
    }
  }, [initialData]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length) {
      try {
        const compressed = await compressFile(acceptedFiles[0]);
        setFile(compressed);
        setFileName(compressed.name);
        toast.success("Archivo procesado");
      } catch (error) {
        console.error(error);
        setFile(acceptedFiles[0]);
        setFileName(acceptedFiles[0].name);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"] 
    },
    onDrop,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha || !area || !encargado || !detalle) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    // Validar tamaño del archivo (máximo 20MB)
    if (file && file.size > 20971520) {
      toast.error("El archivo no puede ser mayor a 20MB");
      return;
    }

    try {
      // Convertir la fecha del input a objeto Date
      const fechaDate = new Date(fecha);

      if (initialData && initialData.id) {
        // Modo edición
        await updateReport(
          initialData.id,
          { fecha: fechaDate, area, encargado, detalle },
          file || undefined
        );
        toast.success("Reporte actualizado correctamente");
      } else {
        // Modo creación
        await createReport(
          { fecha: fechaDate, area, encargado, detalle },
          file || undefined
        );
        toast.success("Reporte creado correctamente");
      }
      // Reiniciar formulario y cerrar modal
      setFecha("");
      setArea("");
      setEncargado("");
      setDetalle("");
      setFile(null);
      setFileName("");
      onClose();
    } catch (error) {
      toast.error("Error al enviar el formulario");
      console.error("Error al enviar el formulario:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-5 rounded-lg w-full max-w-2xl dark:bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {initialData
              ? "Editar Reporte de Mantenimiento"
              : "Crear Reporte de Mantenimiento"}
          </h2>
          <button
            onClick={onClose}
            className="text-black font-bold bg-gray-200 rounded-full py-1 px-3"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div className="flex flex-col">
            <label className="text-sm font-bold">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            />
          </div>

          {/* Área: se utiliza un select con 25 opciones */}
          <div className="flex flex-col">
            <label className="text-sm font-bold">Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            >
              <option value="">Seleccione un área</option>
              {areaOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Encargado */}
          <div className="flex flex-col">
            <label className="text-sm font-bold">Nombre del encargado</label>
            <input
              type="text"
              placeholder="Encargado"
              value={encargado}
              onChange={(e) => setEncargado(e.target.value)}
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            />
          </div>

          {/* Detalle del mantenimiento */}
          <div className="flex flex-col" style={{ marginBottom: "60px" }}>
            <label className="text-sm font-bold">
              Detalle del mantenimiento
            </label>
            <ReactQuill
              className="mt-1 h-48"
              modules={modules}
              formats={formats}
              value={detalle}
              onChange={setDetalle}
            />
          </div>

          {/* Subida de archivo PDF */}
          <div
            {...getRootProps()}
            className="mt-4 flex justify-center items-center border-2 border-dashed border-gray-400 p-4 rounded-lg cursor-pointer"
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <DocumentPlusIcon
                className="mx-auto h-12 w-12 text-gray-300"
                aria-hidden="true"
              />
              {fileName ? (
                <p className="mt-4 text-sm text-gray-600">{fileName}</p>
              ) : (
                <p className="mt-4 text-sm text-indigo-600">
                  {isDragActive
                    ? "Suelta el archivo aquí..."
                    : isCompressing
                    ? "Procesando archivo..."
                    : "Arrastra y suelta el archivo (PDF o Imagen) aquí o haz click"}
                </p>
              )}
              <p className="text-xs text-gray-500">Archivo PDF o Imagen (máximo 20MB)</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} type="button" className="btn-secundary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isCompressing}>
              {isCompressing ? "Procesando..." : (initialData ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceReportForm;
