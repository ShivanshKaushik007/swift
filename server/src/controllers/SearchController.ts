import { Request, Response, NextFunction } from "express";
import Message from "../models/MessagesModel";
import Channel from "../models/ChannelModel";
import User from "../models/UserModel";

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    const userId = req.userId;

    if (!userId) return res.status(400).send("User ID missing");
    if (!query || typeof query !== "string") {
      return res.status(400).send("Search query is required.");
    }

    // Sanitize query for regex
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedQuery, "i");

    // 1. Search Users (Email, First Name, Last Name)
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
      ],
    }).select("firstName lastName email image color");

    // 2. Search Channels (Where user is a member)
    const channels = await Channel.find({
      members: userId,
      name: regex,
    });

    // 3. Search Messages (Where user is sender or recipient, or in a channel the user is in)
    // First, find all channels the user is in
    const userChannels = await Channel.find({ members: userId }).select("_id");
    const channelIds = userChannels.map(c => c._id);

    // Then search messages
    const messages = await Message.find({
      $text: { $search: query }, // requires text index on content
      $or: [
        { sender: userId },
        { recipient: userId },
        { channelId: { $in: channelIds } },
      ],
      deletedAt: { $exists: false }
    })
    .sort({ score: { $meta: "textScore" } })
    .limit(20)
    .populate("sender", "firstName lastName email image color")
    .populate("recipient", "firstName lastName email image color")
    .populate("channelId", "name");

    return res.status(200).json({
      users,
      channels,
      messages
    });
  } catch (error) {
    next(error);
  }
};
