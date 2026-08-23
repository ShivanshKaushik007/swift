import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor, getImageUrl } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { RiCloseFill } from "react-icons/ri";
import { useWebRTC } from "@/context/WebRTCContext";

const ChatHeader = () => {
  const { closeChat, selectedChatData, selectedChatType, typingStatus } = useAppStore();
  const { callUser } = useWebRTC();
  const currentTyping = typingStatus[selectedChatData?._id] || [];
  const isTyping = currentTyping.length > 0;
  return (
    <div className="h-[10vh] min-h-[60px] border-b-2 border-[#2f303b] px-4 sm:px-8 md:px-20 flex items-center justify-between">
  {/* Left Section: Avatar + Name */}
  <div className="flex items-center gap-3 sm:gap-5">
    <div className="w-12 h-12 relative flex-shrink-0">
      {selectedChatType === "contact" ? (
        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
          {selectedChatData.image ? (
            <AvatarImage
              src={getImageUrl(selectedChatData.image)}
              alt="profile"
              className="object-cover w-full h-full bg-black"
            />
          ) : (
            <div
              className={`uppercase h-12 w-12 text-lg border flex items-center justify-center rounded-full ${getColor(
                selectedChatData.color
              )}`}
            >
              {selectedChatData.firstName
                ? selectedChatData.firstName.charAt(0)
                : selectedChatData.email.charAt(0)}
            </div>
          )}
        </Avatar>
      ) : (
        <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full text-white text-xl">
          #
        </div>
      )}
    </div>
    <div className="text-white text-sm sm:text-base truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
      {selectedChatType === "channel" && selectedChatData.name}
      {selectedChatType === "contact" &&
        (selectedChatData.firstName
          ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
          : selectedChatData.email)}
      {isTyping && (
        <div className="text-xs text-[#8417ff] animate-pulse">
          typing...
        </div>
      )}
    </div>
  </div>

  {/* Right Section: Actions */}
  <div className="flex items-center gap-4">
    {selectedChatType === "contact" && (
      <>
        <button
          onClick={() => callUser(selectedChatData._id, "audio")}
          className="text-neutral-500 hover:text-white transition-all duration-300 focus:outline-none"
          title="Voice Call"
          id="btn-voice-call"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        </button>
        <button
          onClick={() => callUser(selectedChatData._id, "video")}
          className="text-neutral-500 hover:text-white transition-all duration-300 focus:outline-none"
          title="Video Call"
          id="btn-video-call"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
      </>
    )}
    <button
      className="text-neutral-500 hover:text-white transition-all duration-300 focus:outline-none ml-2"
      onClick={closeChat}
    >
      <RiCloseFill className="text-2xl sm:text-3xl" />
    </button>
  </div>
</div>
  )
};

export default ChatHeader;

