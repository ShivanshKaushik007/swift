import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import Message from "./models/MessagesModel";
import Channel from "./models/ChannelModel";
import Notification from "./models/NotificationModel";

let ioInstance: SocketIOServer;

const setupSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:5173", "https://swift-qko3.onrender.com"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  ioInstance = io;

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis Adapter connected.");
  }

  const disconnect = (socket: Socket) => {
    console.log(`Client Disconnected: ${socket.id}`);
  };

  const sendMessage = async (message: any) => {
    const createdMessage = await Message.create(message);
    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });

    if (message.recipient) {
      io.to(`user:${message.recipient}`).emit("receiveMessage", messageData);
    }
    if (message.sender) {
      io.to(`user:${message.sender}`).emit("receiveMessage", messageData);
    }

    // Process mentions for DM (though rare in DMs, maybe for third party)
    if (message.mentions && message.mentions.length > 0) {
      for (const mentionId of message.mentions) {
        if (mentionId !== message.sender) {
          const notification = await Notification.create({
            recipient: mentionId,
            sender: message.sender,
            type: "mention",
            messageId: createdMessage._id,
            content: `You were mentioned in a message.`,
          });
          const populatedNotif = await Notification.findById(notification._id).populate("sender", "firstName lastName email image color");
          io.to(`user:${mentionId}`).emit("new-notification", populatedNotif);
        }
      }
    }
  };

  const sendChannelMessage = async (message: any) => {
    const { channelId, sender, content, messageType, fileUrl, replyTo, mentions } = message;
    
    const createdMessage = await Message.create({
      sender,
      recipient: undefined,
      channelId,
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
          io.to(`user:${member._id.toString()}`).emit("recieve-channel-message", finalData);
        });
        
        io.to(`user:${channel.admin.toString()}`).emit("recieve-channel-message", finalData);
      }
      
      // Process mentions for Channels
      if (mentions && mentions.length > 0) {
        for (const mentionId of mentions) {
          if (mentionId !== sender) {
            const notification = await Notification.create({
              recipient: mentionId,
              sender: sender,
              type: "mention",
              channelId: channel._id,
              messageId: createdMessage._id,
              content: `You were mentioned in a channel message.`,
            });
            const populatedNotif = await Notification.findById(notification._id).populate("sender", "firstName lastName email image color");
            io.to(`user:${mentionId}`).emit("new-notification", populatedNotif);
          }
        }
      }
    }
  };

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId} with socket ID: ${socket.id} (joined room user:${userId})`);
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("sendMessage", async (message, callback) => {
      try {
        await sendMessage(message);
        if (typeof callback === 'function') callback({ status: "ok" });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ status: "error", error: error.message });
      }
    });

    socket.on("send-channel-message", async (message, callback) => {
      try {
        await sendChannelMessage(message);
        if (typeof callback === 'function') callback({ status: "ok" });
      } catch (error: any) {
        if (typeof callback === 'function') callback({ status: "error", error: error.message });
      }
    });
    socket.on("typing", ({ recipient, channelId }) => {
      if (recipient) {
        io.to(`user:${recipient}`).emit("typing", { sender: userId });
      } else if (channelId) {
        Channel.findById(channelId).populate("members").then(channel => {
          if (channel) {
            channel.members.forEach((member: any) => {
              if (member._id.toString() !== userId) {
                io.to(`user:${member._id.toString()}`).emit("typing", { sender: userId, channelId });
              }
            });
            if (channel.admin.toString() !== userId) {
              io.to(`user:${channel.admin.toString()}`).emit("typing", { sender: userId, channelId });
            }
          }
        });
      }
    });

    socket.on("stopTyping", ({ recipient, channelId }) => {
      if (recipient) {
        io.to(`user:${recipient}`).emit("stopTyping", { sender: userId });
      } else if (channelId) {
        Channel.findById(channelId).populate("members").then(channel => {
          if (channel) {
            channel.members.forEach((member: any) => {
              if (member._id.toString() !== userId) {
                io.to(`user:${member._id.toString()}`).emit("stopTyping", { sender: userId, channelId });
              }
            });
            if (channel.admin.toString() !== userId) {
              io.to(`user:${channel.admin.toString()}`).emit("stopTyping", { sender: userId, channelId });
            }
          }
        });
      }
    });

    socket.on("messageRead", ({ messageId, recipient, channelId }) => {
      if (recipient) {
        io.to(`user:${recipient}`).emit("messageRead", { messageId, reader: userId });
      } else if (channelId) {
         io.to(channelId).emit("messageRead", { messageId, reader: userId, channelId });
      }
    });

    socket.on("messageEdited", (messageData) => {
      if (messageData.recipient) {
        io.to(`user:${messageData.recipient}`).emit("messageEdited", messageData);
      } else if (messageData.channelId) {
        io.to(messageData.channelId).emit("messageEdited", messageData);
      }
    });

    socket.on("messageDeleted", (messageData) => {
      if (messageData.recipient) {
        io.to(`user:${messageData.recipient}`).emit("messageDeleted", messageData);
      } else if (messageData.channelId) {
        io.to(messageData.channelId).emit("messageDeleted", messageData);
      }
    });

    socket.on("messageReaction", (reactionData) => {
      if (reactionData.recipient) {
        io.to(`user:${reactionData.recipient}`).emit("messageReaction", reactionData);
      } else if (reactionData.channelId) {
        io.to(reactionData.channelId).emit("messageReaction", reactionData);
      }
    });

    socket.on("disconnect", () => disconnect(socket));
  });
};

export const getIo = () => ioInstance;
export default setupSocket;
