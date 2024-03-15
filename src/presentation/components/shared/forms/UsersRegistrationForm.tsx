import { useState } from "react";
import { useDropzone } from 'react-dropzone';
import { useCondominiumStore } from "../../../../store/RegiserUsers";
import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingRegister from "../loaders/LoadingRegister";

const UsersRegistrationForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [condominiumName, setCondominiumName] = useState("");
  const [loading, setLoading] = useState(false);

  const sendExcel = useCondominiumStore((state) => state.sendExcel);

  const handleRegisterCondominiums = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!file || !condominiumName) {
      toast.error("Por favor, llena todos los campos para poder registrar los usuarios");
      setLoading(false);
      return;
    }

    try {
      await sendExcel(file, condominiumName);
      toast.success("Usuarios registrados correctamente");
      setFile(null);
      setCondominiumName("");
      setFileName("");
    } catch (error) {
      console.log(error);
      toast.error("Error al registrar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const dropzoneOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accept: ['.xls', '.xlsx'] as any,
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name); 
    },
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  return (
    <div className="divide-gray-900/10 w-full shadow-md rounded-md">
      {loading && <LoadingRegister />}
      <form
        className="bg-white shadow-sm ring-1 w-full flex-col justify-center mx-auto ring-gray-900/5 sm:rounded-xl"
        onSubmit={handleRegisterCondominiums}
      >
        <div className="px-4 pb-6 sm:p-4">
          <div className="flex-col w-full justify-center">
            <div className="sm:col-span-4">
              <p className="text-md font-bold mt-2 mb-2">
                Registro de condominos
              </p>
              <label htmlFor="nameCondominium" className="block text-sm font-medium leading-6 text-gray-900">
                Nombre del condominio
              </label>
              <div className="mt-2">
                <input
                  value={condominiumName}
                  type="text"
                  name="nameCondominium"
                  id="nameCondominium"
                  className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-72 p-2.5"
                  placeholder="Nombre"
                  onChange={(e) => setCondominiumName(e.target.value)}
                />
              </div>
            </div>
            <span className="bg-yellow-50 mt-2 text-xs font-bold text-yellow-900 px-2 py-1 rounded-sm ">
                  Es importante que se utilice el template para un registro
                  correcto
                </span>
                <button className="bg-indigo-500 mt-2 rounded text-xs text-white ml-2 p-1">
                  Descargar template
                </button>
            <div {...getRootProps()} className="mt-3 h-72 align-middle items-center flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
          <input {...getInputProps()} />
          <div className="text-center">
            <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
            {fileName ? (
              <p className="mt-4 text-sm leading-6 text-gray-600">{fileName}</p>
            ) : (
              <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                {isDragActive ? "Suelta el archivo aquí..." : "Arrastra y suelta el archivo aquí o haz click para seleccionarlo"}
              </p>
            )}
            <p className="text-xs leading-5 text-gray-600">
              XLS hasta 10MB
            </p>
          </div>
        </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
          <button type="button" className="btn-secundary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersRegistrationForm;
