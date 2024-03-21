import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { useDropzone } from "react-dropzone";
import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import { usePublicationStore } from "../../../../store/PublicationsStore";
import "react-quill/dist/quill.snow.css";
import useUserStore from "../../../../store/UserDataStore";
import toast from "react-hot-toast";

interface PublicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Condominium {
  name: string;
  uid: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, true] }],
    ['bold', 'italic', 'underline','strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
}

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "align",
  "strike",
  "script",
  "blockquote",
  "background",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "color",
  "code-block"
]

const PublicationsForm = ({ isOpen, onClose }: PublicationFormProps) => {
  const fetchCondominiums = useUserStore(state => state.fetchCondominiums);
  const condominiums = useUserStore(state => state.condominiums);
  
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [condominiumSelected, setCondominiumSelected] = useState("");
  const [sendToSelected, setSendToSelected] = useState("");
  const [tags, setTags] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState<string>("");
  const [condominiumsList, setCondominiumsList] = useState<Condominium[]>([]);
  const addPublication = usePublicationStore((state) => state.addPublication);

  useEffect(() => {
    fetchCondominiums();
    if(condominiums) {
      setCondominiumsList(condominiums as []);
    }
  }, [fetchCondominiums, condominiums]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !tags || !content || !condominiumSelected || !sendToSelected) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    try {
      const condominiumName = condominiumsList.find((condominium: Condominium) => condominium.uid === condominiumSelected)?.name;

      console.log({ condominiumSelected});

      await addPublication({ title, author, tags, content, file, condominiumId: condominiumSelected, condominiumName: condominiumName || "", sendTo: sendToSelected});
      toast.success("Publicación enviada correctamente");
      setTitle("");
      setAuthor("");
      setTags("");
      setContent("");
      setFile(null);
      setFileName("");
      setCondominiumSelected("");
    } catch (error) {
      toast.error("Error al enviar el formulario");
      console.error("Error al enviar el formulario:", error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overlay-forms flex justify-center items-center">
      <div className="bg-white p-5 h-auto rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Realizar publicación</h2>
          <button
            onClick={onClose}
            className="text-black font-bold bg-indigo-100 rounded-full py-1 px-3"
          >
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center gap-2">
          <div className="flex-col w-full">
            <label className="text-sm font-bold">Título de la publicación</label>
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block mt-1 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="flex-col w-full">
            <label className="text-sm font-bold">Autor</label>
            <input
              type="text"
              placeholder="Autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="block mt-1 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="flex-col w-full">
              <label className="text-sm font-bold">Condominio</label>
              <select onChange={(e) => setCondominiumSelected(e.target.value)} className="block mt-1 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <option value="">Seleccione un condominio</option>
                {condominiumsList.map((condominium: Condominium) => (
                  <option key={condominium.uid} value={condominium.uid}>
                    {condominium.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-col w-full">
              <label className="text-sm font-bold">Etiqueta</label>
              <select
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="block mt-1 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">Seleccione una etiqueta</option>
                <option value="notificacion">Notificacion</option>
                <option value="evento">Evento</option>
                <option value="anuncio">Anuncio</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold">Enviar a</label>
            <select onChange={(e) => setSendToSelected(e.target.value)} className="block mt-1 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
              <option>Selecciona una opción</option>
              <option value="todos">Todos</option>
              <option value="propietario">Propietarios</option>
              <option value="inquilino">Inquilinos</option>
              <option value="familiar">Familiares</option>
              <option value="inquilinoTemporal">Inquilinos temporsales</option>
              <option value="coinquilino">Coinquilino</option>
            </select>
          </div>
          <div className="my-8 h-72">
            <label className="text-sm font-bold">Mensaje</label>
            <ReactQuill className="h-48 md:h-56 mt-1" modules={modules} formats={formats} value={content}  onChange={setContent} />
          </div>
          <label className="text-sm font-bold mt-16 read-only:"></label>
          <div
              {...getRootProps()}
              className="mt-12 h-auto align-middle items-center flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4"
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
                  <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                    {isDragActive
                      ? "Suelta el archivo aquí..."
                      : "Arrastra y suelta el archivo aquí o haz click para seleccionarlo"}
                  </p>
                )}
                <p className="text-xs leading-5 text-gray-600">
                  Hasta 20MB
                </p>
              </div>
            </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} type="submit" className="btn-secundary">
                Cancelar
              </button>
            <button type="submit" className="btn-primary">
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicationsForm;
