import { useState } from "react";
import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import moment from "moment";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor } from "@/lib/utils";
import { BsCheckAll, BsCheck } from "react-icons/bs";
import { FiEdit2, FiTrash2, FiSmile } from "react-icons/fi";
import { FiMoreHorizontal } from "react-icons/fi";
import { apiClient } from "@/lib/api-client";
import EmojiPicker from "emoji-picker-react";

const checkIfImage = (filePath) => {
  if(!filePath) return false;
  const imageRegex = /\.(jpg|jpeg|png|gif|bmp|tiff|tif|webp|svg|ico|heic|heif)$/i;
  // if it's a cloudinary URL without extension but auto detected, we might need to check differently.
  // Assuming extensions are preserved or we can check the URL.
  return imageRegex.test(filePath) || filePath.includes("/image/upload");
};

const getFileUrl = (url) => {
  if(!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${HOST}/${url}`;
};

export const MessageBubble = ({ message, showImageFn, downloadFileFn }) => {
  const { userInfo, selectedChatType, selectedChatData } = useAppStore();
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
      await apiClient.patch(`/api/v1/messages/${message._id}/edit`, { content: editContent }, { withCredentials: true });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/v1/messages/${message._id}/delete`, { withCredentials: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (emoji) => {
    try {
      setShowEmojiPicker(false);
      await apiClient.post(`/api/v1/messages/${message._id}/react`, { emoji: emoji.emoji }, { withCredentials: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className={`relative group mt-5 ${isSender ? "text-right flex flex-col items-end" : "text-left flex flex-col items-start"}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {message.deletedAt ? (
        <div className={`italic text-xs text-white/40 border inline-block p-4 rounded my-1 max-w-[50%] ${isSender ? "ml-11" : ""}`}>
          This message was deleted
        </div>
      ) : (
        <div className="relative max-w-[70%] sm:max-w-[50%] flex flex-col">
          {/* Options Menu on Hover */}
          {showOptions && (
            <div className={`absolute top-0 -mt-8 flex items-center gap-2 bg-[#2a2b33] p-1 rounded-md z-10 ${isSender ? "right-0" : "left-0"}`}>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white/60 hover:text-white"><FiMoreHorizontal /></button>
              {isSender && <button onClick={() => setIsEditing(true)} className="text-white/60 hover:text-white"><FiEdit2 /></button>}
              {isSender && <button onClick={handleDelete} className="text-white/60 hover:text-white"><FiTrash2 /></button>}
              
              {showEmojiPicker && (
                <div className="absolute bottom-10 z-[100]">
                  <EmojiPicker theme="dark" onEmojiClick={handleReact} width={250} height={350} />
                </div>
              )}
            </div>
          )}

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
              } border inline-block p-4 rounded my-1 break-words w-full text-left`}
            >
              {message.messageType === "text" && message.content}
              {message.messageType === "file" && message.fileUrl && (
                checkIfImage(message.fileUrl) ? (
                  <div className="cursor-pointer" onClick={() => showImageFn(getFileUrl(message.fileUrl))}>
                    <img src={getFileUrl(message.fileUrl)} height={300} width={300} className="object-cover" />
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
