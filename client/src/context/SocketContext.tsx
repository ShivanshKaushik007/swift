import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};
export const SocketProvider = ({ children }) => {
  const socket = useRef();
  const { userInfo } = useAppStore();

  useEffect(() => {
    if (userInfo) {
      socket.current = io(HOST, {
        withCredentials: true,
        query: { userId: userInfo.id },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socket.current.on("connect", () => {
        console.log("Connected to socket server");
      });
      const handleReceiveMessage = (message) => {
        const { selectedChatData, selectedChatType, addMessage,addContactsInDMContacts, } =
          useAppStore.getState();
        if (
          selectedChatType !== undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log("message rcv", message);
          addMessage(message);
        }
        addContactsInDMContacts(message);
      };

      const handleReceiveChannelMessage = (message) => {
        const {
          selectedChatData,
          selectedChatType,
          addMessage,
          addChannelInChannelList,
          
        } = useAppStore.getState();
        if (
          selectedChatType !== undefined &&
          selectedChatData._id === message.channelId
        ) {
          addMessage(message);
        }
        addChannelInChannelList(message);
      };

      socket.current.on("receiveMessage", handleReceiveMessage);
      socket.current.on("recieve-channel-message", handleReceiveChannelMessage);

      // Phase 3 Listeners
      socket.current.on("typing", ({ sender, channelId }) => {
        const { setTypingStatus, typingStatus } = useAppStore.getState();
        const chatId = channelId || sender;
        const currentTyping = typingStatus[chatId] || [];
        if (!currentTyping.includes(sender)) {
          setTypingStatus(chatId, [...currentTyping, sender]);
        }
      });

      socket.current.on("stopTyping", ({ sender, channelId }) => {
        const { setTypingStatus, typingStatus } = useAppStore.getState();
        const chatId = channelId || sender;
        const currentTyping = typingStatus[chatId] || [];
        setTypingStatus(chatId, currentTyping.filter(id => id !== sender));
      });

      socket.current.on("messageEdited", (updatedMessage) => {
        const { updateMessage } = useAppStore.getState();
        updateMessage(updatedMessage);
      });

      socket.current.on("messageDeleted", (deletedMessage) => {
        const { updateMessage } = useAppStore.getState();
        updateMessage(deletedMessage);
      });

      socket.current.on("messageReaction", (reactionData) => {
        // reactionData is the updated message or reaction object
        const { updateMessage } = useAppStore.getState();
        updateMessage(reactionData); // assuming server sends back the updated message
      });

      socket.current.on("messageRead", ({ messageId, reader }) => {
        const { markMessagesAsReadInState } = useAppStore.getState();
        markMessagesAsReadInState(messageId, reader);
      });

      return () => {
        socket.current.disconnect();
      };
    }
  }, [userInfo]);
  return (
    <SocketContext.Provider value={socket.current}>
      {children}
    </SocketContext.Provider>
  );
};
