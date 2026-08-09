import { useState } from "react";
import { useAppStore } from "@/store";
import { useSocket } from "@/context/SocketContext";
import { HOST } from "@/utils/constants";
import moment from "moment";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { BsCheckAll, BsCheck } from "react-icons/bs";
import { FiEdit2, FiTrash2, FiSmile, FiCornerUpLeft } from "react-icons/fi";
import { FiMoreHorizontal, FiMessageSquare, FiStar } from "react-icons/fi";
import { AiOutlinePushpin } from "react-icons/ai";
import { apiClient } from "@/lib/api-client";
import EmojiPicker from "emoji-picker-react";

const checkIfImage = (filePath) => {
  if(!filePath) return false;
  const imageRegex = /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
  // if it's a cloudinary URL without extension but auto detected, we might need to check differently.
  // Assuming extensions are preserved or we can check the URL.
  return imageRegex.test(filePath) || filePath.includes("/image/upload");
};

const checkIfVideo = (filePath) => {
  if(!filePath) return false;
  const videoRegex = /\.(mp4|mov|wmv|avi|avchd|flv|f4v|swf|mkv|webm)$/i;
  return videoRegex.test(filePath) || filePath.includes("/video/upload");
};

const getFileUrl = (url) => {
  if(!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${HOST}/${url}`;
};

export const MessageBubble = ({ message, showImageFn, downloadFileFn }) => {
  const socket = useSocket();
  const { userInfo, selectedChatType, selectedChatData, updateMessage, setReplyMessage, setActiveThread } = useAppStore();
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isSender = selectedChatType === "contact" 
    ? message.sender === userInfo.id || (message.sender._id && message.sender._id === userInfo.id)
    : message.sender._id === userInfo.id;

  const senderData = selectedChatType === "channel" ? message.sender : null;

  const handleEdit = async () => {
    if (editContent === message.content) return setIsEditing(false);
    try {
      const response = await apiClient.patch(`/api/v1/messages/${message._id}/edit`, { content: editContent }, { withCredentials: true });
      setIsEditing(false);
      updateMessage(response.data.message);
      if (socket) socket.emit("messageEdited", response.data.message);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(`/api/v1/messages/${message._id}/delete`, { withCredentials: true });
      updateMessage(response.data.message);
      if (socket) socket.emit("messageDeleted", response.data.message);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (emoji) => {
    try {
      setShowEmojiPicker(false);
      const response = await apiClient.post(`/api/v1/messages/${message._id}/react`, { emoji: emoji.emoji }, { withCredentials: true });
      updateMessage(response.data.message);
      if (socket) socket.emit("messageReaction", response.data.message);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePin = async () => {
    try {
      const response = await apiClient.post(`/api/v1/messages/${message._id}/pin`, { isPinned: !message.isPinned }, { withCredentials: true });
      updateMessage(response.data.message);
      if (socket) socket.emit("messageEdited", response.data.message);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStar = async () => {
    try {
      // For starring, it's user-specific, no need to broadcast to other users
      await apiClient.post(`/api/v1/messages/${message._id}/star`, {}, { withCredentials: true });
      // In a full implementation, we'd add it to a local list of starred messages
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      id={`message-${message._id}`}
      className={`relative group mt-5 ${isSender ? "text-right flex flex-col items-end" : "text-left flex flex-col items-start"} transition-colors duration-500`}
    >
      {message.deletedAt ? (
        <div className={`italic text-xs text-white/40 border inline-block p-4 rounded my-1 max-w-[50%] ${isSender ? "ml-11" : ""}`}>
          This message was deleted
        </div>
      ) : (
        <div className="relative max-w-[70%] sm:max-w-[50%] flex flex-col group/bubble">
          {message.replyTo && (
            <div className={`mb-1 p-2 rounded bg-black/20 text-xs text-white/60 border-l-2 ${isSender ? "border-[#8417ff]" : "border-white/20"} cursor-pointer hover:bg-black/40 transition-all`}>
              <div className="font-semibold">{message.replyTo.sender?.firstName || message.replyTo.sender?.email || 'Unknown User'}</div>
              <div className="truncate max-w-[200px]">{message.replyTo.messageType === "text" ? message.replyTo.content : `Attachment (${message.replyTo.fileUrl?.split("/").pop()})`}</div>
            </div>
          )}
          {/* Options Menu on Hover */}
            <div className={`absolute -top-3 ${isSender ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} ${showEmojiPicker ? "flex" : "hidden group-hover/bubble:flex"} items-center z-50`}>
            <div className="flex items-center gap-1 bg-[#2a2b33] p-1 rounded-md shadow-lg border border-white/10">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white/60 hover:text-white p-1"><FiMoreHorizontal /></button>
              <button onClick={() => setReplyMessage(message)} className="text-white/60 hover:text-white p-1"><FiCornerUpLeft /></button>
              <button onClick={() => setActiveThread(message)} className="text-white/60 hover:text-white p-1"><FiMessageSquare /></button>
              <button onClick={handlePin} className={`${message.isPinned ? "text-[#8417ff]" : "text-white/60"} hover:text-white p-1`}><AiOutlinePushpin /></button>
              <button onClick={handleStar} className={`text-white/60 hover:text-yellow-400 p-1`}><FiStar /></button>
              {isSender && <button onClick={() => setIsEditing(true)} className="text-white/60 hover:text-white p-1"><FiEdit2 /></button>}
              {isSender && <button onClick={handleDelete} className="text-white/60 hover:text-white p-1"><FiTrash2 /></button>}
            </div>
            
            {showEmojiPicker && (
              <div className="absolute top-10 z-[100]">
                <EmojiPicker theme="dark" onEmojiClick={handleReact} width={250} height={350} />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-transparent border border-[#8417ff] p-2 rounded text-white outline-none w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <div className="text-xs text-white/50">Press Enter to save, Esc to cancel</div>
            </div>
          ) : (
            <div
              className={`${
                isSender
                  ? "bg-[#8417ff]/100 text-white border-[#8417ff]/50 rounded-lg "
                  : "bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20 rounded-lg "
              } ${message.isPinned ? "border-yellow-500 border-2" : "border"} inline-block p-4 rounded my-1 break-words w-full text-left`}
            >
              {message.messageType === "text" && (
                <div>
                  {message.content.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, index) => 
                    part.startsWith("@") ? <span key={index} className="text-[#8417ff] bg-[#8417ff]/10 px-1 rounded font-semibold">{part}</span> : part
                  )}
                </div>
              )}
              {message.messageType === "file" && message.fileUrl && (
                checkIfImage(message.fileUrl) ? (
                  <div className="cursor-pointer" onClick={() => showImageFn(getFileUrl(message.fileUrl))}>
                    <img src={getFileUrl(message.fileUrl)} height={300} width={300} className="object-cover rounded-md" />
                  </div>
                ) : checkIfVideo(message.fileUrl) ? (
                  <div className="cursor-pointer rounded-md overflow-hidden bg-black max-w-[300px]">
                    <video src={getFileUrl(message.fileUrl)} controls className="w-full max-h-[300px] object-contain" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-white/80 text-3xl bg-black/20 rounded-full p-3"><MdFolderZip /></span>
                    <span className="truncate">{message.fileUrl?.split("/").pop()}</span>
                    <span
                      className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer"
                      onClick={() => downloadFileFn(getFileUrl(message.fileUrl))}
                    >
                      <IoMdArrowRoundDown />
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex gap-1 mt-1 ${isSender ? "justify-end" : "justify-start"} flex-wrap`}>
              {message.reactions.map((r, i) => (
                <span key={i} className="bg-[#2a2b33] px-2 py-1 rounded-full text-xs flex items-center gap-1 cursor-pointer" onClick={() => handleReact({ emoji: r.emoji })}>
                  {r.emoji} <span className="text-white/50">{r.users.length}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata Row */}
      <div className={`flex items-center gap-2 mt-1 ${isSender ? "justify-end" : "justify-start"} w-full`}>
        {!isSender && senderData && (
          <Avatar className="h-6 w-6 rounded-full overflow-hidden">
            {senderData.image ? (
              <AvatarImage src={getFileUrl(senderData.image)} />
            ) : (
              <AvatarFallback className={`text-xs uppercase bg-[#8417ff] flex items-center justify-center h-full w-full`}>
                {senderData.firstName ? senderData.firstName.charAt(0) : senderData.email?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        <span className="text-xs text-white/40">
          {moment(message.timestamp).format("LT")}
        </span>
        {message.isEdited && !message.deletedAt && <span className="text-xs text-white/40">(edited)</span>}
        
        {/* Read Receipts */}
        {isSender && (
          <span className="text-sm">
            {message.status === "read" || (message.readBy && message.readBy.length > 0) ? (
              <BsCheckAll className="text-blue-500" />
            ) : message.status === "delivered" ? (
              <BsCheckAll className="text-gray-400" />
            ) : (
              <BsCheck className="text-gray-400" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
