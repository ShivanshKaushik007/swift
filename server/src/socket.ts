import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import Message from "./models/MessagesModel";
import Channel from "./models/ChannelModel";

let ioInstance: SocketIOServer;

const setupSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:5173", "https://swift-qko3.onrender.com"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  ioInstance = io;

  const userSocketMap = new Map<string, string>();

  const disconnect = (socket: Socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  const sendMessage = async (message: any) => {
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    const createdMessage = await Message.create(message);
    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }
  };

  const sendChannelMessage = async (message: any) => {
    const { channelId, sender, content, messageType, fileUrl, replyTo, mentions } = message;
    
    const createdMessage = await Message.create({
      sender,
      recipient: undefined,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
      replyTo,
      mentions,
    });
    
    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      })
      .exec();

    await Channel.findByIdAndUpdate(channelId, {
      $push: { messages: createdMessage._id },
    });
    
    const channel = await Channel.findById(channelId).populate("members");
    if (channel && messageData) {
      const finalData = { ...messageData.toObject(), channelId: channel._id };
      
      if (channel.members) {
        channel.members.forEach((member: any) => {
          const memberSocketId = userSocketMap.get(member._id.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("recieve-channel-message", finalData);
          }
        });
        
        const adminSocketId = userSocketMap.get(channel.admin.toString());
        if (adminSocketId) {
          io.to(adminSocketId).emit("recieve-channel-message", finalData);
        }       
      }
    }
  };

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("send-channel-message", sendChannelMessage);
    socket.on("typing", ({ recipient, channelId }) => {
      if (recipient) {
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) io.to(recipientSocketId).emit("typing", { sender: userId });
      } else if (channelId) {
        // Find channel members and broadcast
        Channel.findById(channelId).populate("members").then(channel => {
          if (channel) {
            channel.members.forEach((member: any) => {
              if (member._id.toString() !== userId) {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) io.to(memberSocketId).emit("typing", { sender: userId, channelId });
              }
            });
            // Also admin
            if (channel.admin.toString() !== userId) {
              const adminSocketId = userSocketMap.get(channel.admin.toString());
              if (adminSocketId) io.to(adminSocketId).emit("typing", { sender: userId, channelId });
            }
          }
        });
      }
    });

    socket.on("stopTyping", ({ recipient, channelId }) => {
      if (recipient) {
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) io.to(recipientSocketId).emit("stopTyping", { sender: userId });
      } else if (channelId) {
        Channel.findById(channelId).populate("members").then(channel => {
          if (channel) {
            channel.members.forEach((member: any) => {
              if (member._id.toString() !== userId) {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) io.to(memberSocketId).emit("stopTyping", { sender: userId, channelId });
              }
            });
            if (channel.admin.toString() !== userId) {
              const adminSocketId = userSocketMap.get(channel.admin.toString());
              if (adminSocketId) io.to(adminSocketId).emit("stopTyping", { sender: userId, channelId });
            }
          }
        });
      }
    });

    socket.on("messageRead", ({ messageId, recipient, channelId }) => {
      if (recipient) {
        const recipientSocketId = userSocketMap.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("messageRead", { messageId, reader: userId });
        }
      } else if (channelId) {
         io.to(channelId).emit("messageRead", { messageId, reader: userId, channelId });
      }
    });

    socket.on("messageEdited", (messageData) => {
      if (messageData.recipient) {
        const recipientSocketId = userSocketMap.get(messageData.recipient);
        if (recipientSocketId) io.to(recipientSocketId).emit("messageEdited", messageData);
      } else if (messageData.channelId) {
        io.to(messageData.channelId).emit("messageEdited", messageData);
      }
    });

    socket.on("messageDeleted", (messageData) => {
      if (messageData.recipient) {
        const recipientSocketId = userSocketMap.get(messageData.recipient);
        if (recipientSocketId) io.to(recipientSocketId).emit("messageDeleted", messageData);
      } else if (messageData.channelId) {
        io.to(messageData.channelId).emit("messageDeleted", messageData);
      }
    });

    socket.on("messageReaction", (reactionData) => {
      if (reactionData.recipient) {
        const recipientSocketId = userSocketMap.get(reactionData.recipient);
        if (recipientSocketId) io.to(recipientSocketId).emit("messageReaction", reactionData);
      } else if (reactionData.channelId) {
        io.to(reactionData.channelId).emit("messageReaction", reactionData);
      }
    });

    socket.on("disconnect", () => disconnect(socket));
  });
};

export const getIo = () => ioInstance;
export default setupSocket;
