import Message, { IMessage } from "../models/MessagesModel";
import mongoose from "mongoose";

class MessageRepository {
  async getMessagesBetweenUsers(user1: string, user2: string): Promise<IMessage[]> {
    return await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 })
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
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
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);
  }
}

export default new MessageRepository();
