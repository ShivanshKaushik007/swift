import Channel, { IChannel } from "../models/ChannelModel";
import mongoose from "mongoose";

class ChannelRepository {
  async create(data: Partial<IChannel>): Promise<IChannel> {
    const newChannel = new Channel(data);
    return await newChannel.save();
  }

  async findUserChannels(userId: string): Promise<IChannel[]> {
    const objectId = new mongoose.Types.ObjectId(userId);
    return await Channel.find({
      $or: [{ admin: objectId }, { members: objectId }],
    }).sort({ updatedAt: -1 })
      .populate("members", "firstName lastName email _id image color")
      .populate("admin", "firstName lastName email _id image color");
  }

  async findByIdWithMessages(channelId: string): Promise<IChannel | null> {
    return await Channel.findById(channelId).populate({
      path: "messages",
      populate: [
        {
          path: "sender",
          select: "firstName lastName email _id image color",
        },
        {
          path: "replyTo",
          select: "content sender messageType fileUrl",
          populate: { path: "sender", select: "firstName lastName email color" }
        }
      ],
    });
  }
}

export default new ChannelRepository();
