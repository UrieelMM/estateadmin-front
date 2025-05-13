import React from "react";
import { Link } from "react-router-dom";
import { NewsGuideItem } from "../../../../store/useNewsAndGuidesStore";
import moment from "moment";

interface SidebarProps {
  relatedGuides: NewsGuideItem[];
  categories?: string[];
  tags?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  relatedGuides,
  categories,
  tags,
}) => {
  return (
    <aside className="lg:sticky lg:top-20">
      {/* Otras guías recomendadas */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
          Guías relacionadas
        </h3>
        {relatedGuides.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No hay guías relacionadas disponibles.
          </p>
        ) : (
          <div className="space-y-4">
            {relatedGuides.map((guide) => (
              <article key={guide.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={guide.imageUrl}
                    alt={guide.title}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium line-clamp-2">
                    <Link
                      to={`/guias/${guide.slug}`}
                      className="text-gray-800 hover:text-indigo-600"
                    >
                      {guide.title}
                    </Link>
                  </h4>
                  <div className="text-xs text-gray-500 mt-1">
                    {guide.createdAt &&
                      moment(guide.createdAt.toDate()).format("LL")}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Categorías */}
      {categories && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Categorías
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/guias?category=${encodeURIComponent(category)}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-indigo-100 hover:text-indigo-700"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Etiquetas
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/guias?tag=${encodeURIComponent(tag)}`}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
