import { ThreeCircles } from "react-loader-spinner";

const LoadingRegister = () => {
  return (
    <div  className="w-full absolute overlay-forms z-50 right-0 left-0 top-0 bottom-0 h-screen flex items-center justify-center">
      <div className="bg-white w-96 lg:w-[620px] rounded-md shadow-md py-8 px-2 flex-col justify-center items-center">
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
          <p className="text-gray-700 font-medium text-sm md:text-lg text-center mt-4">No cierre esta ventana ni recargue hasta que el proceso se complete</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingRegister;
