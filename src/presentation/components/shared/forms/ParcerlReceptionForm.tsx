import { Fragment, useEffect, useState } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/16/solid";
import useUserStore from "../../../../store/UserDataStore";
import { UserData } from "../../../../interfaces/UserData";
import { useParcelReceptionStore } from "../../../../store/useParcelStore";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
interface FormParcelReceptionProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ParcelReceptionForm = ({ open, setOpen }: FormParcelReceptionProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [receptor, setReceptor] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [dateReception, setDateReception] = useState<string>("");
  const [hourReception, setHourReception] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [file, setFile] = useState<File | File[] | null>(null);
  const [fileName, setFileName] = useState("");

  const fetchCondominiumsUsers = useUserStore(
    (state) => state.fetchCondominiumsUsers
  );
  const condominiumsUsers = useUserStore((state) => state.condominiumsUsers);
  const addParcelReception = useParcelReceptionStore(
    (state) => state.addParcelReception
  );

  useEffect(() => {
    fetchCondominiumsUsers();
    if (condominiumsUsers) {
      setUsers(condominiumsUsers);
    }
  }, [fetchCondominiumsUsers, condominiumsUsers]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRecipientChange = (e: any) => {
    const uid = e.target.value; // Obtiene el nombre del destinatario seleccionado
    const user = users.find((user) => user.uid === uid);
    if (user) {
      setRecipientName(user.name);
      setEmail(user.email);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    if (
      !receptor ||
      !email ||
      !recipientName ||
      !dateReception ||
      !hourReception
    ) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    if (file && (file as File).size > 10485760) {
      toast.error("El tamaño del archivo no debe superar los 10MB");
      return;
    }

    try {
      await addParcelReception({
        receptor,
        email,
        recipientName,
        dateReception,
        hourReception,
        comments,
        file,
      });
      setEmail("");
      setReceptor("");
      setRecipientName("");
      setDateReception("");
      setHourReception("");
      setComments("");
      setFile(null);
      setFileName("");
      setOpen(false);
      setLoading(false);
      toast.success("Paquete registrado correctamente");
    } catch (error) {
      setLoading(false);
      console.error(error);
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
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="overlay-forms absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <form
                    onSubmit={handleSubmit}
                    className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                  >
                    <div className="h-0 flex-1 overflow-y-auto">
                      <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-white">
                            Registrar paquete
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                              onClick={() => setOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-indigo-300">
                            Registra un nuevo paquete para que los condominos lo
                            puedan recoger.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="divide-y divide-gray-200 px-4 sm:px-6">
                          <div className="space-y-6 pb-5 pt-6">
                            <div>
                              <label
                                htmlFor="nameReceptor"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                Nombre de quien recibió el paquete
                              </label>
                              <div className="mt-2">
                                <input
                                  onChange={(e) => setReceptor(e.target.value)}
                                  type="text"
                                  name="nameReceptor"
                                  id="nameReceptor"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="nameRecipient"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                Destinatario
                              </label>
                              <div className="mt-2">
                                <select
                                  onChange={handleRecipientChange}
                                  name="nameRecipient"
                                  id="nameRecipient"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                >
                                  <option value="">
                                    Selecciona un destinatario
                                  </option>
                                  {users.map(
                                    (user) =>
                                      user.role !== "admin" &&
                                      user.role !== "super-admin" &&
                                      user.role !== "security" && (
                                        <option
                                          key={user.uid}
                                          value={user.uid}
                                        >
                                          {user.number} {user.name}
                                        </option>
                                      )
                                  )}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="dateReception"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                Fecha de recepción
                              </label>
                              <div className="mt-2">
                                <input
                                  onChange={(e) =>
                                    setDateReception(e.target.value)
                                  }
                                  type="date"
                                  name="dateReception"
                                  id="dateReception"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="hourReception"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                Hora de recepción
                              </label>
                              <div className="mt-2">
                                <input
                                  onChange={(e) =>
                                    setHourReception(e.target.value)
                                  }
                                  type="time"
                                  name="hourReception"
                                  id="hourReception"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                              </div>
                            </div>
                            <div
                              {...getRootProps()}
                              className="mt-12 h-auto align-middle items-center flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4"
                            >
                              <input {...getInputProps()} />
                              <div className="text-center">
                                <PhotoIcon
                                  className="mx-auto h-12 w-12 text-gray-300"
                                  aria-hidden="true"
                                />
                                {fileName ? (
                                  <p className="mt-4 text-sm leading-6 text-gray-600">
                                    {fileName}
                                  </p>
                                ) : (
                                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                                    {isDragActive
                                      ? "Suelta el archivo aquí..."
                                      : "Arrastra y suelta la foto aquí o haz click para seleccionarlo"}
                                  </p>
                                )}
                                <p className="text-xs leading-5 text-gray-600">
                                  Hasta 10MB
                                </p>
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="comments"
                                className="block text-sm font-medium leading-6 text-gray-900"
                              >
                                Comentarios
                              </label>
                              <div className="mt-2">
                                <textarea
                                  onChange={(e) => setComments(e.target.value)}
                                  id="comments"
                                  name="comments"
                                  rows={4}
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                  defaultValue={""}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 justify-end px-4 py-4">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {loading ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-indigo-100 rounded-full"
                            viewBox="0 0 24 24"
                          ></svg>
                        ) : (
                          "Guardar"
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ParcelReceptionForm;
