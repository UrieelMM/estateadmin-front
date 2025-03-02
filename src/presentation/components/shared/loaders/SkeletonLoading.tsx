import React from "react";

const SkeletonLoading: React.FC = () => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Sección izquierda: Gráfica skeleton */}
        <div
          role="status"
          className="flex-1 p-4 border border-gray-200 rounded-lg shadow-sm animate-pulse md:p-6 dark:border-gray-200"
        >
          <div className="h-2.5 bg-gray-200 rounded dark:bg-gray-300 w-32 mb-2.5"></div>
          <div className="w-48 h-2 mb-10 bg-gray-200 rounded-full dark:bg-gray-300"></div>
          <div className="flex items-baseline mt-4 gap-6">
            <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-56 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-64 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-80 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-72 dark:bg-gray-300"></div>
            <div className="w-full bg-gray-200 rounded-t-lg h-80 dark:bg-gray-300"></div>
          </div>
        </div>

        {/* Sección derecha: Lista de cards skeleton */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Card 1 */}
          <div role="status" className="p-4 border rounded-lg border-gray-200 shadow-sm animate-pulse dark:border-gray-200">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-300 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px]"></div>
          </div>

          {/* Card 2 */}
          <div role="status" className="p-4 border border-gray-200 rounded-lg shadow-sm animate-pulse dark:border-gray-200">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-300 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px]"></div>
          </div>

          {/* Card 3 */}
          <div role="status" className="p-4 border border-gray-200 rounded-lg shadow-sm animate-pulse dark:border-gray-200">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-300 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-300 max-w-[360px]"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SkeletonLoading;
