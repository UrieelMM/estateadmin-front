import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface TourButtonProps {
  onClick: () => void;
}

const TourButton = ({ onClick }: TourButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      title="Ver tour de la aplicación"
      aria-label="Ver tour de la aplicación"
    >
      <QuestionMarkCircleIcon className="h-6 w-6" />
    </button>
  );
};

export default TourButton;
