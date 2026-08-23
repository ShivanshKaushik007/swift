import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store";
import {
  GET_ALL_MESSAGES_ROUTE,
  GET_CHANNEL_MESSAGES,
  HOST,
} from "@/utils/constants";
import moment from "moment";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { MdFolderZip } from "react-icons/md";
import { IoMdArrowRoundDown } from "react-icons/io";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColor, getImageUrl } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { useSocket } from "@/context/SocketContext";
import { AiOutlinePushpin } from "react-icons/ai";

const MessageContainer = () => {
  const scrollRef = useRef();
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
    prependMessages,
    setFileDownloadProgress,
    setIsDownloading,
    updateMessage,
  } = useAppStore();
  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  const pinnedMessages = selectedChatMessages.filter(m => m.isPinned);
  
  // Ensure pinnedIndex is within bounds if a message is unpinned
  useEffect(() => {
    if (pinnedIndex >= pinnedMessages.length && pinnedMessages.length > 0) {
      setPinnedIndex(pinnedMessages.length - 1);
    }
  }, [pinnedMessages.length, pinnedIndex]);

  // Display message from newest to oldest based on pinnedIndex
  const displayMessage = pinnedMessages[pinnedMessages.length - 1 - (pinnedIndex % pinnedMessages.length)] || pinnedMessages[0];

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-[#8417ff]/20', 'rounded-lg', 'p-2');
      setTimeout(() => {
        el.classList.remove('bg-[#8417ff]/20', 'rounded-lg', 'p-2');
      }, 1500);
    }
  };

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await apiClient.post(
          GET_ALL_MESSAGES_ROUTE,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
          setHasMore(response.data.messages.length === 50);
        }
      } catch (error) {
        console.log({ error });
      }
    };
    const getChannelMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_CHANNEL_MESSAGES}/${selectedChatData._id}`,
          { withCredentials: true }
        );
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
          setHasMore(response.data.messages.length === 50);
        }
      } catch (error) {
        console.log({ error });
      }
    };
    if (selectedChatData._id) {
      if (selectedChatType === "contact") getMessages();
      else if (selectedChatType === "channel") getChannelMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || selectedChatMessages.length === 0) return;
    setIsLoadingMore(true);
    
    const cursor = selectedChatMessages[0].timestamp;
    
    // Save current scroll height to restore position after prepend
    const prevScrollHeight = containerRef.current?.scrollHeight;
    
    try {
      let newMessages = [];
      if (selectedChatType === "contact") {
        const response = await apiClient.post(
          `${GET_ALL_MESSAGES_ROUTE}?cursor=${cursor}`,
          { id: selectedChatData._id },
          { withCredentials: true }
        );
        newMessages = response.data.messages || [];
      } else if (selectedChatType === "channel") {
        const response = await apiClient.get(
          `${GET_CHANNEL_MESSAGES}/${selectedChatData._id}?cursor=${cursor}`,
          { withCredentials: true }
        );
        newMessages = response.data.messages || [];
      }
      
      if (newMessages.length > 0) {
        prependMessages(newMessages);
        setHasMore(newMessages.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
      // Restore scroll position so it doesn't jump to top
      setTimeout(() => {
        if (containerRef.current && prevScrollHeight) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeight;
        }
      }, 0);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behaviour: "smooth" });
    }
  }, [selectedChatMessages]);

  // File helper
  const getFileUrl = (url) => {
    return getImageUrl(url);
  };

  // Read receipts emitting
  const socket = useSocket();
  useEffect(() => {
    if (selectedChatMessages.length > 0 && selectedChatType === "contact" && socket) {
      const unreadMessages = selectedChatMessages.filter(
        msg => msg.sender !== userInfo.id && (!msg.readBy || !msg.readBy.some(read => read.user === userInfo.id))
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => {
          socket.emit("messageRead", { messageId: msg._id, recipient: msg.sender });
        });
        
        // Also call API to persist
        apiClient.post("/api/v1/messages/mark-read", {
          messageIds: unreadMessages.map(m => m._id)
        }, { withCredentials: true }).catch(console.error);
      }
    }
  }, [selectedChatMessages, selectedChatType, socket, userInfo.id]);
  const downloadFile = async (url) => {
    setIsDownloading(true);
    setFileDownloadProgress(0);
    const response = await apiClient.get(getFileUrl(url), {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        const percentCompleted = Math.round((loaded * 100) / total);
        setFileDownloadProgress(percentCompleted);
      },
    });
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", url.split("/").pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
    setIsDownloading(false);
    setFileDownloadProgress(0);
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          <MessageBubble 
            message={message} 
            showImageFn={(url) => { setShowImage(true); setImageURL(url); }}
            downloadFileFn={downloadFile}
          />
        </div>
      );
    });
  };

  return (
    <div 
      className="relative flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 w-full"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="flex justify-center p-2">
          <span className="text-white/50 text-xs">Loading older messages...</span>
        </div>
      )}
      {displayMessage && (
        <div 
          onClick={() => {
            handleScrollToMessage(displayMessage._id);
            if (pinnedMessages.length > 1) {
              setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
            }
          }}
          className="sticky top-0 z-40 w-full bg-[#2a2b33]/90 backdrop-blur-sm border-l-4 border-[#8417ff] rounded-md shadow-md p-3 flex items-center justify-between cursor-pointer hover:bg-[#2a2b33] transition-colors mb-4"
        >
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <AiOutlinePushpin className="text-[#8417ff] text-xl flex-shrink-0" />
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-xs text-[#8417ff] font-semibold">
                Pinned Message {pinnedMessages.length > 1 && `(${pinnedIndex + 1}/${pinnedMessages.length})`}
              </span>
              <span className="text-sm text-white/80 truncate max-w-[200px] sm:max-w-md">
                {displayMessage.messageType === "text" ? displayMessage.content : "Attachment"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Multi-pin indicators */}
            {pinnedMessages.length > 1 && (
              <div className="flex flex-col gap-[2px] mr-2">
                {pinnedMessages.map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${i === pinnedIndex ? 'bg-[#8417ff]' : 'bg-white/20'}`} />
                ))}
              </div>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                apiClient.post(`/api/v1/messages/${displayMessage._id}/pin`, { isPinned: false }, { withCredentials: true })
                  .then(res => {
                    updateMessage(res.data.message);
                    if (socket) socket.emit("messageEdited", res.data.message);
                  })
                  .catch(console.error);
              }} 
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <IoCloseSharp className="text-xl" />
            </button>
          </div>
        </div>
      )}
      
      {renderMessages()}
      <div ref={scrollRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100dvh] w-[100dvw] flex items-center justify-center backdrop-blur-lg flex-col  ">
          <div>
            <img
              src={getFileUrl(imageURL)}
              className="h-[80dvh] w-full bg-cover mt-8 "
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-4 ">
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => downloadFile(imageURL)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
