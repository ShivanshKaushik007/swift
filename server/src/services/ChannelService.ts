import ChannelRepository from "../repositories/ChannelRepository";
import UserRepository from "../repositories/UserRepository";
import mongoose from "mongoose";
import { getCache, setCache } from "../utils/redis";

export class ChannelService {
  async createChannel(userId: string, name: string, members: string[]) {
    const admin = await UserRepository.findById(userId);
    if (!admin) {
      throw new Error("Admin user not found.");
    }
    
    // Convert string IDs to ObjectIds
    const memberObjectIds = members.map(id => new mongoose.Types.ObjectId(id));
    
    const newChannel = await ChannelRepository.create({
      name,
      members: memberObjectIds,
      admin: new mongoose.Types.ObjectId(userId),
    });
    
    // Invalidate cache for all members and admin
    for (const member of members) {
      const cacheKey = `user_channels:${member}`;
      await getCache(cacheKey).then(async (cached) => {
        if(cached) {
          const { deleteCache } = await import("../utils/redis");
          await deleteCache(cacheKey);
        }
      });
    }
    
    return newChannel;
  }

  async getUserChannels(userId: string) {
    const cacheKey = `user_channels:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    const channels = await ChannelRepository.findUserChannels(userId);
    const Message = (await import("../models/MessagesModel")).default;
    const objectId = new mongoose.Types.ObjectId(userId);

    const channelsWithUnread = await Promise.all(channels.map(async (channel) => {
      const unreadCount = await Message.countDocuments({
        channelId: channel._id,
        "readBy.user": { $ne: objectId }
      });
      const lastMsg = await Message.findOne({ channelId: channel._id })
        .sort({ timestamp: -1 })
        .select("content messageType timestamp sender readBy")
        .lean();
        
      return { 
        ...channel.toObject(), 
        unreadCount,
        lastMessageContent: lastMsg ? lastMsg.content : null,
        lastMessageType: lastMsg ? lastMsg.messageType : null,
        lastMessageTime: lastMsg ? lastMsg.timestamp : channel.updatedAt,
        lastMessageSender: lastMsg ? lastMsg.sender : null,
        lastMessageReadBy: lastMsg ? lastMsg.readBy : null,
      };
    }));

    await setCache(cacheKey, channelsWithUnread, 300); // cache for 5 minutes
    return channelsWithUnread;
  }

  async getChannelMessages(channelId: string, limit: number = 50, cursor?: string) {
    const channel = await ChannelRepository.findById(channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }
    
    // We now fetch messages directly from MessageRepository
    const MessageRepository = (await import("../repositories/MessageRepository")).default;
    const parsedCursor = cursor ? new Date(cursor) : undefined;
    return await MessageRepository.getChannelMessages(channelId, limit, parsedCursor);
  }
}

export default new ChannelService();
