import { Request, Response, NextFunction } from "express";
import { messageService } from "../services/MessageService";

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;

    if (!user1) return res.status(400).send("User ID missing");
    if (!user2) {
      return res.status(400).send("Both user ID's are required. ");
    }

    const messages = await messageService.getMessages(user1, user2);
    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).send("File is required");
    }

    const filePath = await messageService.uploadFile(req.file);
    return res.status(200).json({ filePath });
  } catch (error) {
    next(error);
  }
};
