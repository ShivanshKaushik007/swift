import { Request, Response, NextFunction } from "express";
import channelService from "../services/ChannelService";

export const createChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(400).send("User ID missing");
    if (!name || !members || !Array.isArray(members)) {
        return res.status(400).send("Name and members array are required.");
    }

    const newChannel = await channelService.createChannel(userId, name, members);
    return res.status(201).json({ channel: newChannel });
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("valid users")) {
        return res.status(400).send(error.message);
    }
    next(error);
  }
};

export const getUserChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    const channels = await channelService.getUserChannels(userId);
    return res.status(200).json({ channels }); // Changed 201 to 200 for GET request
  } catch (error) {
    next(error);
  }
};

export const getChannelMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const cursor = req.query.cursor as string;
    if (!channelId) return res.status(400).send("Channel ID is required");

    const messages = await channelService.getChannelMessages(channelId as string, 50, cursor);
    return res.status(200).json({ messages }); // Changed 201 to 200 for GET request
  } catch (error: any) {
    if (error.message.includes("not found")) {
        return res.status(404).send(error.message);
    }
    next(error);
  }
};
