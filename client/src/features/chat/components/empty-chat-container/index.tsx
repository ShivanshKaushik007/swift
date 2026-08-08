import Lottie from "react-lottie";
import animationData from "@/assets/phone";
const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData
 };
const EmptyChatContainer = () => {
  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-center items-center hidden duration-1000 transition-all  ">
      <Lottie
        isClickToPauseDisabled={true}
        height={340}
        width={350}
        options={defaultOptions}
      />
      <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-2 lg:text-4xl text-3xl transition-all duration-300 text-center">
        <h3 className="poppins-medium">
          Hi<span className="text-purple-500">!</span> Welcome to 
          <span className="text-5xl font-bold font-mono" >'Sw<span className="text-purple-500" >i</span>ft'</span>
          <span className="text-purple-500">.</span>
        </h3>
      </div>
    </div>
  );
};

export default EmptyChatContainer;
