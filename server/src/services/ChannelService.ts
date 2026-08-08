import ChannelRepository from "../repositories/ChannelRepository";
import UserRepository from "../repositories/UserRepository";
import mongoose from "mongoose";

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
    
    return newChannel;
  }

  async getUserChannels(userId: string) {
    return await ChannelRepository.findUserChannels(userId);
  }

  async getChannelMessages(channelId: string) {
    const channel = await ChannelRepository.findByIdWithMessages(channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }
    return channel.messages;
  }
}

export default new ChannelService();
