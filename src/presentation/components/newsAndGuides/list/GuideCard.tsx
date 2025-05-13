import React from "react";
import { Link } from "react-router-dom";
import { NewsGuideItem } from "../../../../store/useNewsAndGuidesStore";
import moment from "moment";

interface GuideCardProps {
  guide: NewsGuideItem;
}

const GuideCard: React.FC<GuideCardProps> = ({ guide }) => {
  return (
    <article className="bg-white rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg">
      <Link to={`/guias/${guide.slug}`} className="block">
        <img
          src={guide.imageUrl}
          alt={guide.title}
          className="w-full h-48 object-cover"
        />
        <div className="p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            {guide.categories?.slice(0, 2).map((category) => (
              <span
                key={category}
                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            {guide.title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {guide.excerpt || guide.subtitle}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {guide.createdAt && moment(guide.createdAt.toDate()).format("LL")}
            </span>
            <span className="text-sm text-indigo-600">Leer más &rarr;</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default GuideCard;
