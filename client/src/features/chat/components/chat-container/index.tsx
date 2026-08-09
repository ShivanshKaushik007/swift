import ChatHeader from "./components/chat-header";
import MessageBar from "./components/message-bar";
import MessageContainer from "./components/message-container";
import ThreadSidebar from "./components/thread-sidebar";
import { useAppStore } from "@/store";

const ChatContainer = () => {
  const { activeThread } = useAppStore();
  
  return (
    <div className="flex h-[100vh] w-[100vw] md:w-full">
      <div className="flex-1 flex flex-col bg-[#1c1d25]">
        <ChatHeader/>
        <MessageContainer/>
        <MessageBar/>
      </div>
      {activeThread && <ThreadSidebar />}
    </div>
  );
};

export default ChatContainer;
