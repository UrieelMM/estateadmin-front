import { Link } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface PublicBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const PublicBreadcrumb = ({ items, className = "" }: PublicBreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 ${className}`}
    >
      <ol className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400 dark:text-gray-500">/</span>}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-medium text-gray-900 dark:text-gray-100"
                      : ""
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PublicBreadcrumb;

