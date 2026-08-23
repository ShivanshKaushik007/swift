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
    await setCache(cacheKey, channels, 300); // cache for 5 minutes
    return channels;
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
