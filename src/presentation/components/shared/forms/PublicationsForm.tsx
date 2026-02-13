import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import { useDropzone } from "react-dropzone";
import {
  DocumentPlusIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import { usePublicationStore } from "../../../../store/usePublicationStore";
import "react-quill/dist/quill.snow.css";
import { useCondominiumStore } from "../../../../store/useCondominiumStore";
import toast from "react-hot-toast";
import { useFileCompression } from "../../../../hooks/useFileCompression";
import { usePublicationAIStore } from "../../../../store/usePublicationAIStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  PUBLICATION_AI_TEMPLATES,
  type PublicationAITemplateId,
} from "./publicationAITemplates";

interface PublicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const modules = {
  toolbar: [
    [ { header: [ 1, 2, 3, 4, true ] } ],
    [ "bold", "italic", "underline", "strike", "blockquote" ],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [ { color: [] }, { background: [] } ],
    [ "link" ],
    [ "clean" ],
  ],
};

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
  "code-block",
];

const PublicationsForm = ( { isOpen, onClose }: PublicationFormProps ) => {
  const selectedCondominium = useCondominiumStore(
    ( state ) => state.selectedCondominium
  );

  const [ title, setTitle ] = useState<string>( "" );
  const [ author, setAuthor ] = useState<string>( "" );
  const [ condominiumSelected, setCondominiumSelected ] = useState( "" );
  const [ sendToSelected, setSendToSelected ] = useState( "" );
  const [ tags, setTags ] = useState<string>( "" );
  const [ file, setFile ] = useState<File | null>( null );
  const [ fileName, setFileName ] = useState( "" );
  const [ content, setContent ] = useState<string>( "" );
  const [ aiIdea, setAiIdea ] = useState( "" );
  const addPublication = usePublicationStore( ( state ) => state.addPublication );
  const { compressFile, isCompressing } = useFileCompression();
  const {
    draft,
    selectedTemplateId,
    isGenerating,
    error: aiError,
    quotaRemaining,
    quotaLimit,
    quotaResetAt,
    setTemplate,
    generateDraft,
    refreshQuotaStatus,
    clearDraft,
  } = usePublicationAIStore( ( state ) => ( {
    draft: state.draft,
    selectedTemplateId: state.selectedTemplateId,
    isGenerating: state.isGenerating,
    error: state.error,
    quotaRemaining: state.quotaRemaining,
    quotaLimit: state.quotaLimit,
    quotaResetAt: state.quotaResetAt,
    setTemplate: state.setTemplate,
    generateDraft: state.generateDraft,
    refreshQuotaStatus: state.refreshQuotaStatus,
    clearDraft: state.clearDraft,
  } ) );

  useEffect( () => {
    if ( selectedCondominium ) {
      setCondominiumSelected( selectedCondominium.id );
    }
  }, [ selectedCondominium ] );

  useEffect( () => {
    if ( isOpen ) {
      refreshQuotaStatus();
    }
  }, [ isOpen, refreshQuotaStatus ] );

  const inlineMarkdownToHtml = ( text: string ): string => {
    return text
      .replace( /\*\*(.*?)\*\*/g, "<strong>$1</strong>" )
      .replace( /\*(.*?)\*/g, "<em>$1</em>" )
      .replace(
        /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
  };

  const markdownToHtml = ( markdown: string ): string => {
    const lines = markdown.split( /\r?\n/ );
    const html: string[] = [];
    let inList = false;

    for ( const rawLine of lines ) {
      const line = rawLine.trim();
      if ( !line ) {
        if ( inList ) {
          html.push( "</ul>" );
          inList = false;
        }
        continue;
      }

      const headingMatch = line.match( /^(#{1,3})\s+(.*)$/ );
      if ( headingMatch ) {
        if ( inList ) {
          html.push( "</ul>" );
          inList = false;
        }
        const level = Math.min( 3, headingMatch[ 1 ].length );
        html.push(
          `<h${ level }>${ inlineMarkdownToHtml( headingMatch[ 2 ] ) }</h${ level }>`
        );
        continue;
      }

      const listMatch = line.match( /^[-*]\s+(.*)$/ );
      if ( listMatch ) {
        if ( !inList ) {
          html.push( "<ul>" );
          inList = true;
        }
        html.push( `<li>${ inlineMarkdownToHtml( listMatch[ 1 ] ) }</li>` );
        continue;
      }

      if ( inList ) {
        html.push( "</ul>" );
        inList = false;
      }
      html.push( `<p>${ inlineMarkdownToHtml( line ) }</p>` );
    }

    if ( inList ) {
      html.push( "</ul>" );
    }

    return html.join( "" );
  };

  const handleGenerateWithAI = async () => {
    if ( !aiIdea.trim() ) {
      toast.error( "Ingresa una idea general para redactar con IA." );
      return;
    }

    await generateDraft( {
      idea: aiIdea.trim(),
      title: title.trim() || undefined,
      tag: tags || undefined,
      sendTo: sendToSelected || undefined,
      author: author.trim() || undefined,
    } );
  };

  const handleUseAIDraft = () => {
    if ( !draft.trim() ) return;
    setContent( markdownToHtml( draft ) );
    toast.success( "Borrador IA aplicado al mensaje." );
  };

  const handleSubmit = async ( e: React.FormEvent ) => {
    e.preventDefault();
    if (
      !title ||
      !author ||
      !tags ||
      !content ||
      !condominiumSelected ||
      !sendToSelected
    ) {
      toast.error( "Todos los campos son requeridos" );
      return;
    }

    if ( file && file.size > 20971520 ) {
      toast.error( "El archivo no puede ser mayor a 20MB" );
      return;
    }

    try {
      const condominiumName = selectedCondominium?.name || "";

      await addPublication( {
        title,
        author,
        tags,
        content,
        file,
        condominiumId: condominiumSelected,
        condominiumName: condominiumName || "",
        sendTo: sendToSelected,
      } );
      toast.success( "Publicación enviada correctamente" );
      setTitle( "" );
      setAuthor( "" );
      setTags( "" );
      setContent( "" );
      setAiIdea( "" );
      clearDraft();
      setFile( null );
      setFileName( "" );
      setCondominiumSelected( "" );
      onClose();
    } catch ( error ) {
      toast.error( "Error al enviar el formulario" );
      console.error( "Error al enviar el formulario:", error );
    }
  };

  const dropzoneOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accept: {
      "application/vnd.ms-excel": [ ".xls" ],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "image/*": [ ".png", ".jpg", ".jpeg" ],
      "application/pdf": [ ".pdf" ],
    },
    onDrop: async ( acceptedFiles: File[] ) => {
      try {
        const compressed = await compressFile( acceptedFiles[ 0 ] );
        setFile( compressed );
        setFileName( compressed.name );
        toast.success( "Archivo procesado" );
      } catch ( error ) {
        console.error( error );
        setFile( acceptedFiles[ 0 ] );
        setFileName( acceptedFiles[ 0 ].name );
      }
    },
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone( dropzoneOptions );

  if ( !isOpen ) return null;

  return (
    <div className="fixed inset-0 overlay-forms flex justify-center items-center p-4">
      <div className="bg-white p-5 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Realizar publicación</h2>
          <button
            onClick={ onClose }
            className="text-black font-bold bg-indigo-100 rounded-full py-1 px-3"
          >
            X
          </button>
        </div>
        <form onSubmit={ handleSubmit } className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex-col w-full">
              <label className="text-sm font-bold dark:text-gray-100">
                Título de la publicación
              </label>
              <input
                type="text"
                placeholder="Título"
                value={ title }
                onChange={ ( e ) => setTitle( e.target.value ) }
                className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
              />
            </div>
            <div className="flex-col w-full">
              <label className="text-sm font-bold dark:text-gray-100">
                Autor
              </label>
              <input
                type="text"
                placeholder="Autor"
                value={ author }
                onChange={ ( e ) => setAuthor( e.target.value ) }
                className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="flex-col w-full">
              <label className="text-sm font-bold dark:text-gray-100">
                Condominio
              </label>
              <input
                type="text"
                value={ selectedCondominium?.name || "" }
                className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
                readOnly
              />
            </div>
            <div className="flex-col w-full">
              <label className="text-sm font-bold dark:text-gray-100">
                Etiqueta
              </label>
              <select
                value={ tags }
                onChange={ ( e ) => setTags( e.target.value ) }
                className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
              >
                <option value="">Seleccione una etiqueta</option>
                <option value="notificacion">Notificacion</option>
                <option value="evento">Evento</option>
                <option value="anuncio">Anuncio</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold dark:text-gray-100">
              Enviar a
            </label>
            <select
              onChange={ ( e ) => setSendToSelected( e.target.value ) }
              className="px-2 block w-full rounded-md ring-1 outline-none border-0 py-1.5 text-gray-900 shadow-sm  ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-500 focus:ring-2 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-400 dark:ring-none dark:outline-none dark:focus:ring-2 dark:ring-indigo-500"
            >
              <option>Selecciona una opción</option>
              <option value="todos">Todos</option>
              <option value="propietario">Propietarios</option>
              <option value="inquilino">Inquilinos</option>
            </select>
          </div>
          <div className="my-8 h-72">
            <label className="text-sm font-bold dark:text-gray-100">
              Mensaje
            </label>
            <ReactQuill
              className="h-48 md:h-56 mt-1"
              modules={ modules }
              formats={ formats }
              value={ content }
              onChange={ setContent }
            />
          </div>

          <div className="mt-8 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                  Redactar con IA
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Powered by EstateAdmin IA
              </span>
            </div>
            <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
              Uso: { Math.max( 0, quotaLimit - quotaRemaining ) }/{ quotaLimit } ·
              disponibles: { quotaRemaining }/{ quotaLimit }
              { quotaResetAt
                ? ` · Reinicio: ${ new Date( quotaResetAt ).toLocaleString( "es-MX" ) }`
                : "" }
            </p>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                Plantilla IA
              </label>
              <select
                value={ selectedTemplateId }
                onChange={ ( e ) =>
                  setTemplate( e.target.value as PublicationAITemplateId )
                }
                className="mb-3 w-full rounded-md border border-indigo-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {PUBLICATION_AI_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
              <textarea
                value={ aiIdea }
                onChange={ ( e ) => setAiIdea( e.target.value ) }
                rows={ 3 }
                placeholder="Describe la idea general de la publicación..."
                className="w-full rounded-md border border-indigo-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-indigo-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={ handleGenerateWithAI }
                disabled={ isGenerating }
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                { isGenerating ? "Generando..." : "Generar borrador" }
              </button>
              { draft && (
                <button
                  type="button"
                  onClick={ handleUseAIDraft }
                  className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <ClipboardDocumentCheckIcon className="mr-2 h-4 w-4" />
                  Usar en mensaje
                </button>
              ) }
            </div>

            { aiError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{ aiError }</p>
            ) }

            { draft && (
              <div className="mt-4 rounded-md border border-indigo-200 bg-white p-3 dark:border-indigo-700 dark:bg-gray-800">
                <p className="mb-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Vista previa IA
                </p>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={ [ remarkGfm ] }>{ draft }</ReactMarkdown>
                </div>
              </div>
            ) }
          </div>
          <label className="text-sm font-bold mt-16 read-only:"></label>
          <div
            { ...getRootProps() }
            className="mt-12 h-auto flex items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-4 dark:border-indigo-900"
          >
            <input { ...getInputProps() } />
            <div className="text-center">
              <DocumentPlusIcon
                className="mx-auto h-12 w-12 text-gray-300"
                aria-hidden="true"
              />
              { fileName ? (
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  { fileName }
                </p>
              ) : (
                <p className="mt-4 text-sm leading-6 font-medium text-indigo-600">
                  { isDragActive
                    ? "Suelta el archivo aquí..."
                    : isCompressing
                      ? "Procesando archivo..."
                      : "Arrastra y suelta el archivo aquí o haz click para seleccionarlo" }
                </p>
              ) }
              <p className="text-xs leading-5 text-gray-600">Hasta 20MB</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={ onClose } type="button" className="btn-secundary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={ isCompressing }>
              { isCompressing ? "Procesando..." : "Enviar" }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicationsForm;
