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
    const cursor = req.query.cursor as string;

    const messages = await messageService.getMessages(user1, user2, 50, cursor);
    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const getThreadMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const messages = await messageService.getThreadMessages(id);
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

export const editMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const message = await messageService.editMessage(id, req.userId!, content);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const message = await messageService.deleteMessage(id, req.userId!);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const message = await messageService.reactToMessage(id, req.userId!, emoji);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const pinMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const message = await messageService.pinMessage(id, isPinned);
    return res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
};

export const starMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const starredMessages = await messageService.toggleStarMessage(id, req.userId!);
    return res.status(200).json({ starredMessages });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageIds } = req.body;
    const messages = await messageService.markMessagesAsRead(messageIds, req.userId!);
    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};
