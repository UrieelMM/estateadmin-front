import { ThreeCircles } from "react-loader-spinner";

const LoadingApp = () => {
  return (
    <div className="w-full h-20 flex items-center justify-center my-4">
      <ThreeCircles
        visible={true}
        height="65"
        width="65"
        ariaLabel="comment-loading"
        wrapperStyle={{}}
        wrapperClass="comment-wrapper"
        color="#6366F1"
      />
    </div>
  );
};

export default LoadingApp;
