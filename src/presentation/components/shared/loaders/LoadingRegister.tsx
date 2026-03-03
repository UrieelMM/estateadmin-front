import { ThreeCircles } from "react-loader-spinner";

const LoadingRegister = () => {
  return (
    <div className="fixed inset-0 z-[80] flex min-h-[100dvh] items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex w-full max-w-[620px] flex-col items-center justify-center rounded-md bg-white px-3 py-8 shadow-md dark:bg-gray-900">
        <div className="mx-auto flex w-full justify-center">
          <ThreeCircles
            visible={true}
            height="50"
            width="50"
            ariaLabel="comment-loading"
            wrapperStyle={{}}
            wrapperClass="comment-wrapper"
            color="#6366F1"
          />
        </div>
        <div>
          <p className="text-gray-700 dark:text-gray-100 font-medium text-sm md:text-lg text-center mt-4">
            No cierre esta ventana ni recargue hasta que el proceso se complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingRegister;
