import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useCondominiumStore } from "../../../../store/useRegisterUserStore";
import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import LoadingRegister from "../loaders/LoadingRegister";
import useUserStore from "../../../../store/UserDataStore";

interface Condominium {
  name: string;
  uid: string;
}

const UsersRegistrationForm = () => {
  const fetchCondominiums = useUserStore((state) => state.fetchCondominiums);
  const condominiums = useUserStore((state) => state.condominiums);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [condominiumsList, setCondominiumsList] = useState([]);
  const [condominiumId, setCondominiumId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCondominiums();
    if (condominiums) {
      setCondominiumsList(condominiums as []);
    }
  }, [fetchCondominiums, condominiums]);

  const sendExcel = useCondominiumStore((state) => state.sendExcel);

  const handleRegisterCondominiums = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!file || !condominiumId) {
      toast.error(
        "Por favor, llena todos los campos para poder registrar los usuarios"
      );
      setLoading(false);
      return;
    }

    try {
      await sendExcel(file, condominiumId);
      toast.success("Usuarios registrados correctamente");
      setFile(null);
      setCondominiumId("");
      setFileName("");
    } catch (error) {
      toast.error("Error al registrar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const dropzoneOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accept: [".xls", ".xlsx"] as any,
    onDrop: (acceptedFiles: File[]) => {
      setFile(acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);
    },
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  return (
    <div className="divide-gray-900/10 w-full shadow-md rounded-md px-8 dark:bg-gray-800 dark:text-gray-100 dark:shadow-2xl">
      {loading && <LoadingRegister />}
      <form
        className="bg-white shadow-sm ring-1 w-full flex-col justify-center mx-auto ring-gray-900/5 sm:rounded-xl"
        onSubmit={handleRegisterCondominiums}
      >
        <div className="px-4 mt-6 pb-6 sm:p-4 dark:bg-gray-800 dark:text-gray-100">
          <div className="flex-col w-full justify-center">
            <div className="sm:col-span-4">
              <p className="text-md font-bold mt-2 mb-2">
                Registra a los usuarios del condominio
              </p>
              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                Selecciona el condominio
              </label>
              <div className="mt-2">
                <select
                  onChange={(e) => setCondominiumId(e.target.value)}
                  className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-50"
                >
                  <option> Selecciona una opcion </option>
                  {condominiumsList.map((condominium: Condominium) => (
                    <option key={condominium.uid} value={condominium.uid}>
                      {condominium.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 mb-4">
              <span className="bg-yellow-50 mt-4 text-xs font-bold text-yellow-900 px-2 py-1 rounded-sm ">
                Es importante que se utilice el template para un registro
                correcto
              </span>
              <button className="bg-indigo-500 mt-2 rounded text-xs text-white ml-2 p-1">
                <a href="https://res.cloudinary.com/dz5tntwl1/raw/upload/v1710883105/template-registro-de-usuarios_yw3tih.xlsx">
                  Descargar template
                </a>
              </button>
            </div>
            <div
              {...getRootProps()}
              className="mt-12 h-72 flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-800"
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <DocumentPlusIcon
                  className="mx-auto h-12 w-12 text-gray-300"
                  aria-hidden="true"
                />
                {fileName ? (
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {fileName}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600 dark:text-indigo-400">
                    {isDragActive
                      ? "Suelta el archivo aquí..."
                      : "Arrastra y suelta el archivo aquí o haz click para seleccionarlo"}
                  </p>
                )}
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-100">
                  XLS hasta 10MB
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 dark:bg-gray-800 dark:text-gray-100">
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
