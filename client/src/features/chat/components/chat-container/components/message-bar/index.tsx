import { useSocket } from "@/context/SocketContext";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import { UPLOAD_FILE_ROUTE } from "@/utils/constants";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { IoCloseSharp } from "react-icons/io5";
import { HOST } from "@/utils/constants";

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
    replyMessage,
    setReplyMessage,
  } = useAppStore();
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Draft Messages Logic
  const draftKey = `draft_${selectedChatData?._id}`;
  
  useEffect(() => {
    if (selectedChatData) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) setMessage(savedDraft);
      else setMessage("");
    }
  }, [selectedChatData]);

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
        replyTo: replyMessage ? replyMessage._id : undefined,
      });

    } else if (selectedChatType === "channel") {
      socket.emit("send-channel-message", {
        sender: userInfo.id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        channelId: selectedChatData._id,
        replyTo: replyMessage ? replyMessage._id : undefined,
        mentions: selectedMentions,
      });
    }
    setMessage("");
    localStorage.removeItem(draftKey);
    setReplyMessage(null);
    setSelectedMentions([]);
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
              replyTo: replyMessage ? replyMessage._id : undefined,
            });
          } else if (selectedChatType === "channel") {
            socket.emit("send-channel-message", {
              sender: userInfo.id,
              content: undefined,
              messageType: "file",
              fileUrl: response.data.filePath,
              channelId: selectedChatData._id,
              replyTo: replyMessage ? replyMessage._id : undefined,
            });
          }
          setReplyMessage(null);
        }
      }
      console.log({ file });
    } catch (error) {
      setIsUploading(false);
      console.log({ error });
    }
  };
  return (
    <div className="w-full px-4 sm:px-8 mb-6 flex flex-col gap-2">
      {replyMessage && (
        <div className="w-full bg-[#1c1d25] p-3 rounded-md flex items-center justify-between border-l-4 border-[#8417ff]">
          <div className="flex flex-col">
            <span className="text-xs text-[#8417ff] font-semibold">Replying to {replyMessage.sender?.firstName || replyMessage.sender?.email || "User"}</span>
            <span className="text-sm text-white/60 truncate max-w-[200px] sm:max-w-md">{replyMessage.messageType === "text" ? replyMessage.content : "File attachment"}</span>
          </div>
          <button onClick={() => setReplyMessage(null)} className="text-white/60 hover:text-white transition-all"><IoCloseSharp className="text-xl" /></button>
        </div>
      )}
  
  {showMentions && selectedChatType === "channel" && selectedChatData.members && (
    <div className="absolute bottom-24 left-4 sm:left-8 bg-[#2a2b33] rounded-md shadow-lg border border-white/10 overflow-hidden z-50 w-[250px]">
      <div className="px-3 py-2 text-xs font-semibold text-white/50 border-b border-white/10 bg-[#1c1d25]">Members</div>
      <div className="max-h-[200px] overflow-y-auto">
        {selectedChatData.members
          .filter(m => (m.firstName + " " + m.lastName).toLowerCase().includes(mentionQuery) || m.email?.toLowerCase().includes(mentionQuery))
          .map(member => (
            <div 
              key={member._id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer transition-all"
              onClick={() => {
                const val = message;
                const lastAt = val.lastIndexOf("@");
                const newVal = val.slice(0, lastAt) + `@${member.firstName || member.email} ` ;
                setMessage(newVal);
                setShowMentions(false);
                if (!selectedMentions.includes(member._id)) {
                  setSelectedMentions([...selectedMentions, member._id]);
                }
              }}
            >
              <div className="h-6 w-6 rounded-full bg-[#8417ff] flex items-center justify-center text-xs uppercase overflow-hidden">
                {member.image ? <img src={`${HOST}/${member.image}`} className="w-full h-full object-cover"/> : member.firstName?.charAt(0) || member.email?.charAt(0)}
              </div>
              <span className="text-sm">{member.firstName} {member.lastName}</span>
            </div>
        ))}
      </div>
    </div>
  )}
  <div className="h-[10dvh] max-h-20 min-h-[60px] w-full bg-[#1c1d25] flex justify-center items-center gap-3 sm:gap-6 rounded-md">
    {/* Input & tools container */}
    <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-2 sm:gap-5 pr-2 sm:pr-5 ">
      <input
        type="text"
        className="flex-1 px-3 sm:px-5 py-2 sm:py-3 bg-transparent text-white rounded-md focus:outline-none text-sm sm:text-base"
        placeholder="Enter Message"
        value={message}
        onChange={(e) => {
          const val = e.target.value;
          setMessage(val);
          localStorage.setItem(draftKey, val);
          
          if (selectedChatType === "channel") {
            const lastAt = val.lastIndexOf("@");
            if (lastAt !== -1) {
              const query = val.slice(lastAt + 1);
              if (!query.includes(" ")) {
                setShowMentions(true);
                setMentionQuery(query.toLowerCase());
              } else {
                setShowMentions(false);
              }
            } else {
              setShowMentions(false);
            }
          }
          
          // Emit typing event
          const typingData = {
            sender: userInfo.id,
            recipient: selectedChatType === "contact" ? selectedChatData._id : undefined,
            channelId: selectedChatType === "channel" ? selectedChatData._id : undefined,
          };
          socket.emit("typing", typingData);

          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", typingData);
          }, 2000);
        }}
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
