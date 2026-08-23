import { Request, Response } from "express";
import User from "../models/UserModel";
import Message from "../models/MessagesModel";
import Channel from "../models/ChannelModel";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active Users
    const dau = await User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } });
    const wau = await User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } });
    const mau = await User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } });

    // Messages
    const totalMessages = await Message.countDocuments();
    
    // Channels
    const totalChannels = await Channel.countDocuments();
    // Channels active in the last 7 days
    const activeChannels = (await Message.distinct('channelId', { 
        timestamp: { $gte: sevenDaysAgo },
        channelId: { $ne: null }
    })).length;

    // Peak Hours (Aggregate messages by hour of day)
    const peakHours = await Message.aggregate([
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    const formattedPeakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      messages: peakHours.find(p => p._id === i)?.count || 0
    }));

    // User Growth (last 30 days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          _id: { $exists: true } // all users, but we group by day
        }
      },
      {
        $group: {
          _id: {
            // we use the object id timestamp since createdAt is not on User schema
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$_id" } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 30 }
    ]);

    const formattedUserGrowth = userGrowth.map(item => ({
        date: item._id,
        users: item.count
    }));

    return res.status(200).json({
      dau,
      wau,
      mau,
      totalMessages,
      totalChannels,
      activeChannels,
      peakHours: formattedPeakHours,
      userGrowth: formattedUserGrowth,
    });
  } catch (error: any) {
    console.error({ error });
    return res.status(500).send("Internal Server Error");
  }
};
