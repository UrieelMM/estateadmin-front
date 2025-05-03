import { ThreeCircles } from "react-loader-spinner";

const Loading = () => {
  return (
    <div className="w-full h-screen bg-indigo-50  flex items-center justify-center dark:bg-gray-900 dark:text-white">
      <ThreeCircles
        visible={true}
        height="100"
        width="100"
        ariaLabel="comment-loading"
        wrapperStyle={{}}
        wrapperClass="comment-wrapper"
        color="#6366F1"
      />
    </div>
  );
};

export default Loading;
