import { Request, Response, NextFunction } from "express";
import Notification from "../models/NotificationModel";

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "firstName lastName email image color");

    return res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.userId;
    
    if (!userId) return res.status(400).send("User ID missing");
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).send("Notification IDs are required.");
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: userId },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const clearAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
