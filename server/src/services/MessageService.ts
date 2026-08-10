import MessageRepository from "../repositories/MessageRepository";
import UserRepository from "../repositories/UserRepository";
import Message from "../models/MessagesModel";
import { mkdirSync, renameSync } from "fs";

export class MessageService {
  async getMessages(user1: string, user2: string) {
    return await MessageRepository.getMessagesBetweenUsers(user1, user2);
  }

  async getThreadMessages(threadId: string) {
    return await Message.find({ threadId })
      .sort({ timestamp: 1 })
      .populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color");
  }

  async uploadFile(file: Express.Multer.File) {
    // With multer-storage-cloudinary, file.path is the remote URL
    return file.path;
  }

  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.sender.toString() !== userId) throw new Error("Unauthorized");
    if (message.deletedAt) throw new Error("Cannot edit a deleted message");

    message.content = newContent;
    message.isEdited = true;
    await message.save();
    return await Message.findById(messageId)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.sender.toString() !== userId) throw new Error("Unauthorized");
    
    message.deletedAt = new Date();
    message.content = undefined; // Scrub content
    message.attachments = [];
    await message.save();
    return await Message.findById(messageId)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
  }

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex > -1) {
      const userIndex = message.reactions[reactionIndex].users.findIndex(id => id.toString() === userId);
      if (userIndex > -1) {
        message.reactions[reactionIndex].users.splice(userIndex, 1);
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        message.reactions[reactionIndex].users.push(userId as any);
      }
    } else {
      message.reactions.push({ emoji, users: [userId as any] });
    }
    
    await message.save();
    return await Message.findById(messageId)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
  }

  async pinMessage(messageId: string, isPinned: boolean) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    message.isPinned = isPinned;
    await message.save();
    return await Message.findById(messageId)
      .populate("sender", "id email firstName lastName image color")
      .populate({
        path: "replyTo",
        select: "content sender messageType fileUrl",
        populate: { path: "sender", select: "firstName lastName email color" }
      });
  }

  async toggleStarMessage(messageId: string, userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error("User not found");
    
    const index = user.starredMessages.findIndex(id => id.toString() === messageId);
    if (index > -1) {
      user.starredMessages.splice(index, 1);
    } else {
      user.starredMessages.push(messageId as any);
    }
    await user.save();
    return user.starredMessages;
  }

  async markMessagesAsRead(messageIds: string[], userId: string) {
    // This could be optimized into a single updateMany, but this is explicit
    const updatedMessages = [];
    for (const msgId of messageIds) {
      const msg = await Message.findById(msgId);
      if (msg && !msg.readBy.some(read => read.user.toString() === userId)) {
        msg.readBy.push({ user: userId as any, readAt: new Date() });
        msg.status = "read";
        await msg.save();
        updatedMessages.push(msg);
      }
    }
    return updatedMessages;
  }
}

export class ContactsService {
  async searchContacts(userId: string, searchTerm: string) {
    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizedSearchTerm, "i");
    return await UserRepository.searchContacts(userId, regex);
  }

  async getContactsForDMList(userId: string) {
    return await MessageRepository.getContactsForDMList(userId);
  }

  async getAllContacts(userId: string) {
    const users = await UserRepository.getAllContacts(userId);
    return users.map(user => ({
      label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      value: user._id,
    }));
  }
}

export const messageService = new MessageService();
export const contactsService = new ContactsService();
