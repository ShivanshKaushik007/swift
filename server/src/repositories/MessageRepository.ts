import Message, { IMessage } from "../models/MessagesModel";
import mongoose from "mongoose";

class MessageRepository {
  async getMessagesBetweenUsers(user1: string, user2: string, limit: number = 50, cursor?: Date): Promise<IMessage[]> {
    const query: any = {
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    };
    if (cursor) {
      query.timestamp = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
      
    return messages.reverse();
  }

  async getChannelMessages(channelId: string, limit: number = 50, cursor?: Date): Promise<IMessage[]> {
    const query: any = { channelId };
    
    if (cursor) {
      query.timestamp = { $lt: cursor };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
      
    return messages.reverse();
  }

  async getContactsForDMList(userId: string): Promise<any[]> {
    const objectId = new mongoose.Types.ObjectId(userId);
    return await Message.aggregate([
      {
        $match: {
          $or: [{ sender: objectId }, { recipient: objectId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", objectId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$timestamp" },
          lastMessageContent: { $first: "$content" },
          lastMessageType: { $first: "$messageType" },
          lastMessageSender: { $first: "$sender" },
          lastMessageReadBy: { $first: "$readBy" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", objectId] },
                    { $not: { $in: [objectId, { $ifNull: ["$readBy.user", []] }] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessageTime: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
          unreadCount: 1,
          lastMessageContent: 1,
          lastMessageType: 1,
          lastMessageSender: 1,
          lastMessageReadBy: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);
  }
}

export default new MessageRepository();
