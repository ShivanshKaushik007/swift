import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { RiCloseFill } from "react-icons/ri";
const ChatHeader = () => {
  const { closeChat, selectedChatData, selectedChatType } = useAppStore();
  return (
    <div className="h-[10vh] min-h-[60px] border-b-2 border-[#2f303b] px-4 sm:px-8 md:px-20 flex items-center justify-between">
  {/* Left Section: Avatar + Name */}
  <div className="flex items-center gap-3 sm:gap-5">
    <div className="w-12 h-12 relative flex-shrink-0">
      {selectedChatType === "contact" ? (
        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
          {selectedChatData.image ? (
            <AvatarImage
              src={`${HOST}/${selectedChatData.image}`}
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
    </div>
  </div>

  {/* Right Section: Close Button */}
  <div className="flex items-center gap-3">
    <button
      className="text-neutral-500 hover:text-white transition-all duration-300 focus:outline-none"
      onClick={closeChat}
    >
      <RiCloseFill className="text-2xl sm:text-3xl" />
    </button>
  </div>
</div>
  )
};

export default ChatHeader;

