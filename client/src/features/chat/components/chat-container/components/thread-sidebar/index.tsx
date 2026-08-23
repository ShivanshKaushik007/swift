import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store";
import { apiClient } from "@/lib/api-client";
import { IoCloseSharp, IoSend } from "react-icons/io5";
import { MessageBubble } from "../message-container/MessageBubble";
import { useSocket } from "@/context/SocketContext";
import moment from "moment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";

const getFileUrl = (url) => {
  return getImageUrl(url);
};

const ThreadSidebar = () => {
  const { activeThread, setActiveThread, userInfo, selectedChatType, selectedChatData } = useAppStore();
  const [threadMessages, setThreadMessages] = useState([]);
  const [reply, setReply] = useState("");
  const socket = useSocket();
  const scrollRef = useRef();

  useEffect(() => {
    const fetchThreadMessages = async () => {
      try {
        const response = await apiClient.get(`/api/v1/messages/thread/${activeThread._id}`, {
          withCredentials: true,
        });
        setThreadMessages(response.data.messages);
      } catch (error) {
        console.error(error);
      }
    };
    if (activeThread) {
      fetchThreadMessages();
    }
  }, [activeThread]);

  // Listen for new messages in thread
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (message) => {
      if (message.threadId === activeThread?._id) {
        setThreadMessages((prev) => [...prev, message]);
      }
    };
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("recieve-channel-message", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("recieve-channel-message", handleReceiveMessage);
    };
  }, [socket, activeThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages]);

  const handleSendReply = () => {
    if (!reply.trim()) return;

    if (selectedChatType === "contact") {
      socket.emit("sendMessage", {
        sender: userInfo.id,
        content: reply,
        recipient: selectedChatData._id,
        messageType: "text",
        threadId: activeThread._id,
      });
    } else if (selectedChatType === "channel") {
      socket.emit("send-channel-message", {
        sender: userInfo.id,
        content: reply,
        messageType: "text",
        channelId: selectedChatData._id,
        threadId: activeThread._id,
      });
    }
    setReply("");
  };

  const renderParentMessage = () => {
    const senderData = activeThread.sender;
    return (
      <div className="flex gap-3 p-4 border-b border-[#2a2b33]">
        <Avatar className="h-8 w-8 rounded-full overflow-hidden">
          {senderData?.image ? (
            <AvatarImage src={getFileUrl(senderData.image)} />
          ) : (
            <AvatarFallback className="text-sm uppercase bg-[#8417ff] flex items-center justify-center h-full w-full">
              {senderData?.firstName ? senderData.firstName.charAt(0) : senderData?.email?.charAt(0)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <div className="flex gap-2 items-baseline">
            <span className="font-semibold text-sm">{senderData?.firstName || senderData?.email}</span>
            <span className="text-xs text-white/40">{moment(activeThread.timestamp).format("LT")}</span>
          </div>
          <div className="text-sm mt-1 text-white/80">{activeThread.content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-[350px] border-l border-[#2a2b33] bg-[#1c1d25] flex flex-col h-full z-50">
      {/* Header */}
      <div className="h-[10vh] min-h-[73px] border-b border-[#2a2b33] flex items-center justify-between px-5 font-semibold">
        <span>Thread</span>
        <button onClick={() => setActiveThread(null)} className="text-white/60 hover:text-white transition-all">
          <IoCloseSharp className="text-2xl" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {renderParentMessage()}
        
        <div className="p-4 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-xs text-white/40">{threadMessages.length} replies</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>
          
          {threadMessages.map((msg) => (
            <MessageBubble 
              key={msg._id} 
              message={msg} 
              showImageFn={(url) => window.open(url, "_blank")}
              downloadFileFn={(url) => window.open(url, "_blank")}
            />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#2a2b33]">
        <div className="bg-[#2a2b33] rounded-md flex items-center px-3 py-2">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            placeholder="Reply in thread..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendReply(); }}
          />
          <button onClick={handleSendReply} className="text-[#8417ff] p-2 ml-2 hover:bg-[#8417ff]/20 rounded-md transition-all">
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadSidebar;
