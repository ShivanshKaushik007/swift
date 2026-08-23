export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatData: undefined,
  selectedChatMessages: [],
  directMessagesContacts: [],
  isUploading: false,
  isDownloading: false,
  fileUploadProgress: 0,
  fileDownloadProgress: 0,
  channels: [],
  typingStatus: {}, // { chatId: [userIds] }
  replyMessage: null,
  setReplyMessage: (message) => set({ replyMessage: message }),
  activeThread: null,
  setActiveThread: (thread) => set({ activeThread: thread }),
  setChannels: (channels) => set({ channels }),
  setTypingStatus: (chatId, userIds) => {
    const typingStatus = get().typingStatus;
    set({ typingStatus: { ...typingStatus, [chatId]: userIds } });
  },
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
  setFileDownloadProgress: (fileDownloadProgress) =>
    set({ fileDownloadProgress }),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
  setSelectedChatData: (selectedChatData) => {
    // Clear unread count for this contact/channel when opened
    const type = get().selectedChatType;
    if (type === "contact") {
      const dmContacts = [...get().directMessagesContacts];
      const index = dmContacts.findIndex((c: any) => c._id === selectedChatData._id);
      if (index !== -1) {
        dmContacts[index] = { ...dmContacts[index], unreadCount: 0 };
        set({ directMessagesContacts: dmContacts });
      }
    } else if (type === "channel") {
      const channels = [...get().channels];
      const index = channels.findIndex((c: any) => c._id === selectedChatData._id);
      if (index !== -1) {
        channels[index] = { ...channels[index], unreadCount: 0 };
        set({ channels });
      }
    }
    set({ selectedChatData });
  },
  setSelectedChatMessages: (selectedChatMessages) =>
    set({ selectedChatMessages }),
  prependMessages: (messages) => {
    const selectedChatMessages = get().selectedChatMessages;
    set({ selectedChatMessages: [...messages, ...selectedChatMessages] });
  },
  setDirectMessagesContacts: (directMessagesContacts) =>
    set({ directMessagesContacts }),
  addChannel: (channel) => {
    const channels = get().channels;
    set({ channels: [channel, ...channels] });
  },
  closeChat: () =>
    set({
      selectedChatData: undefined,
      selectedChatType: undefined,
      selectedChatMessages: [],
    }),
  addMessage: (message) => {
    const selectedChatMessages = get().selectedChatMessages;
    const selectedChatType = get().selectedChatType;

    set({
      selectedChatMessages: [
        ...selectedChatMessages,
        {
          ...message,
          recipient:
            selectedChatType === "channel"
              ? message.recipient
              : message.recipient._id,
          sender:
            selectedChatType === "channel"
              ? message.sender
              : message.sender._id,
        },
      ],
    });
  },
  updateMessage: (updatedMessage) => {
    const messages = get().selectedChatMessages;
    const index = messages.findIndex((m) => m._id === updatedMessage._id);
    if (index !== -1) {
      const newMessages = [...messages];
      const merged = { ...newMessages[index], ...updatedMessage };
      
      // Preserve populated sender/recipient if they were objects
      if (newMessages[index].sender && typeof newMessages[index].sender === 'object') {
        merged.sender = newMessages[index].sender;
      }
      if (newMessages[index].recipient && typeof newMessages[index].recipient === 'object') {
        merged.recipient = newMessages[index].recipient;
      }
      
      newMessages[index] = merged;
      set({ selectedChatMessages: newMessages });
    }
  },
  markMessagesAsReadInState: (messageId, readerId) => {
    const messages = get().selectedChatMessages;
    const index = messages.findIndex((m) => m._id === messageId);
    if (index !== -1) {
      const newMessages = [...messages];
      const msg = newMessages[index];
      if (!msg.readBy) msg.readBy = [];
      if (!msg.readBy.some(read => read.user === readerId)) {
        msg.readBy.push({ user: readerId, readAt: new Date() });
        msg.status = "read";
      }
      set({ selectedChatMessages: newMessages });
    }
  },
  addChannelInChannelList: (message) => {
    const channels = [...get().channels];
    const index = channels.findIndex(
      (channel) => channel._id === message.channelId
    );

    const isUnread = get().selectedChatData?._id !== message.channelId && message.sender._id !== get().userInfo.id;

    if (index !== -1) {
      const data = channels[index];
      if (isUnread) data.unreadCount = (data.unreadCount || 0) + 1;
      data.lastMessageContent = message.messageType === "text" ? message.content : null;
      data.lastMessageType = message.messageType;
      data.lastMessageTime = message.timestamp;
      data.lastMessageSender = message.sender._id || message.sender;
      data.lastMessageReadBy = message.readBy || [];
      
      channels.splice(index, 1);
      channels.unshift(data);
    }
    set({ channels });
  },
  addContactsInDMContacts: (message) => {
    const userId = get().userInfo.id;
    const fromId =
      message.sender._id === userId
        ? message.recipient._id
        : message.sender._id;
    const fromData =
      message.sender._id === userId ? message.recipient : message.sender;
    const dmContacts = [...get().directMessagesContacts];
    const index = dmContacts.findIndex((contact) => contact._id === fromId);

    const isUnread = get().selectedChatData?._id !== fromId && message.sender._id !== userId;

    if (index !== -1) {
      const data = dmContacts[index];
      if (isUnread) data.unreadCount = (data.unreadCount || 0) + 1;
      data.lastMessageContent = message.messageType === "text" ? message.content : null;
      data.lastMessageType = message.messageType;
      data.lastMessageTime = message.timestamp;
      data.lastMessageSender = message.sender._id || message.sender;
      data.lastMessageReadBy = message.readBy || [];
      
      dmContacts.splice(index, 1);
      dmContacts.unshift(data);
    } else {
      if (isUnread) fromData.unreadCount = 1;
      fromData.lastMessageContent = message.messageType === "text" ? message.content : null;
      fromData.lastMessageType = message.messageType;
      fromData.lastMessageTime = message.timestamp;
      fromData.lastMessageSender = message.sender._id || message.sender;
      fromData.lastMessageReadBy = message.readBy || [];
      
      dmContacts.unshift(fromData);
    }
    set({ directMessagesContacts: dmContacts });
  },
});
