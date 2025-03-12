import { useState, useEffect } from "react";
import PublicationsForm from "../../../components/shared/forms/PublicationsForm";
import { usePublicationStore } from "../../../../store/usePublicationStore";
import { getRandomIndigoTone } from "../../../../utils/generateColor";

const Publications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { publications, loadPublications, hasMore } = usePublicationStore(
    (state) => ({
      publications: state.publications,
      loadPublications: state.loadPublications,
      hasMore: state.hasMore,
    })
  );

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const onClose = () => {
    setIsOpen(!isOpen);
  };

  const stripHtml = (htmlString: string) => {
    return htmlString.replace(/<[^>]*>/g, "");
  };

  return (
    <>
      <header className="bg-gray-50 font-medium shadow-lg flex w-full h-16 justify-between px-2 rounded-md items-center mb-6 dark:shadow-2xl dark:bg-gray-800 dark:text-gray-100">
        <p className="tex-md font-medium">Publicaciones</p>
        <button className="btn-primary h-10 mb-3" onClick={onClose}>
          Nueva publicación
        </button>
      </header>
      <PublicationsForm onClose={onClose} isOpen={isOpen} />

      <div className="container mx-auto">
        <ul
          aria-label="User feed"
          role="feed"
          className="relative flex flex-col gap-12 py-12 pl-8 before:absolute before:top-0 before:left-8 before:h-full before:-translate-x-1/2 before:border before:border-dashed before:border-slate-200 after:absolute after:top-6 after:left-8 after:bottom-6 after:-translate-x-1/2 after:border after:border-slate-200 "
        >
          {/* Visualización de las publicaciones */}
          {publications.map((publication, index) => (
            <>
              <li role="article" className="relative pl-8" key={index}>
                <div className="flex flex-col flex-1 gap-4">
                  <a
                    href="#"
                    className="absolute z-10 inline-flex items-center justify-center w-8 h-8 text-white rounded-full -left-4 ring-2 ring-white"
                  >
                    {/*  bg color must be random color */}
                    <div
                      className={`w-14 h-full text-white rounded-full flex justify-center items-center ${getRandomIndigoTone()}`}
                    >
                      {publication.author[0].toUpperCase()}
                    </div>
                  </a>
                  <h4 className="flex flex-col items-start text-lg font-medium leading-8 text-slate-700 md:flex-row lg:items-center">
                    <span className="flex flex-col justify-center items-end">
                      <span className="bg-indigo-500 rounded-lg p-2 text-white text-xs ml-2 dark:text-gray-100">
                        {publication.tags}
                      </span>
                      <span className="dark:text-gray-100" >
                        {publication.title} - {publication.author}
                      </span>
                    </span>
                    <span className="text-sm font-normal text-slate-400">
                      {publication.createdAt && (
                        <p className="dark:text-gray-400 ml-2">
                          Fecha:{" "}
                          {publication.createdAt.toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </span>
                  </h4>
                  <p>{stripHtml(publication.content)}</p>
                </div>
              </li>
            </>
          ))}
          {hasMore && (
            <button
              className="btn-load-more"
              onClick={() => loadPublications(true)}
            >
              Cargar más
            </button>
          )}
        </ul>
      </div>
    </>
  );
};

export default Publications;
