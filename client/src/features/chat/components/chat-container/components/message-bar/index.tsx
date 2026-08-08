import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
const MessageBar = () => {
  const emojiRef = useRef();
  const fileInputRef = useRef();
  const socket = useSocket();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    setIsUploading,
    setFileUploadProgress,
  } = useAppStore();
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };
  const handleSendMessage = async () => {
    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });

    } else if (selectedChatType === "channel") {
      socket.emit("send-channel-message", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        channelId: selectedChatData._id,
      });
    }
    setMessage((msg) => "");
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleAttachmentChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        setIsUploading(true);
        const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
          withCredentials: true,
          onUploadProgress: (data) => {
            setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
          },
        });

        if (response.status === 200 && response.data) {
          setIsUploading(false);
          if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
              sender: userInfo.id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileUrl: response.data.filePath,
            });
          } else if (selectedChatType === "channel") {
            socket.emit("send-channel-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: response.data.filePath,
              channelId: selectedChatData._id,
            });
          }
        }
      }
      console.log({ file });
    } catch (error) {
      setIsUploading(false);
      console.log({ error });
    }
  };
  return (
    <div className="w-full px-4 sm:px-8 mb-6">
  <div className="h-[10dvh] max-h-20 min-h-[60px] w-full bg-[#1c1d25] flex justify-center items-center gap-3 sm:gap-6 rounded-md">
    {/* Input & tools container */}
    <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-2 sm:gap-5 pr-2 sm:pr-5 ">
      <input
        type="text"
        className="flex-1 px-3 sm:px-5 py-2 sm:py-3 bg-transparent text-white rounded-md focus:outline-none text-sm sm:text-base"
        placeholder="Enter Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="text-neutral-500 hover:text-white transition-all duration-300"
        onClick={handleAttachmentClick}
      >
        <GrAttachment className="text-lg sm:text-2xl" />
      </button>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAttachmentChange}
      />
      <div className="relative">
        <button
          className="text-neutral-500 hover:text-white transition-all duration-300"
          onClick={() => setEmojiPickerOpen(true)}
        >
          <RiEmojiStickerLine className="text-lg sm:text-2xl" />
        </button>
        <div className="absolute bottom-16 right-0 z-50" ref={emojiRef}>
          <EmojiPicker
            theme="dark"
            open={emojiPickerOpen}
            onEmojiClick={handleAddEmoji}
            autoFocusSearch={false}
          />
        </div>
      </div>
    </div>

    {/* Submit button */}
    <button
      className="bg-[#8417ff] rounded-lg flex items-center justify-center p-3 sm:p-5 focus:outline-none hover:bg-[#741bda] transition-all duration-300"
      onClick={handleSendMessage}
    >
      <IoSend className="text-lg sm:text-2xl text-white" />
    </button>
  </div>
</div>
  );
};

export default MessageBar;
