import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware";
import { getNotifications, markAsRead, clearAll } from "../controllers/NotificationController";

const notificationRoutes = Router();

notificationRoutes.get("/", verifyToken, getNotifications);
notificationRoutes.post("/mark-read", verifyToken, markAsRead);
notificationRoutes.delete("/", verifyToken, clearAll);

export default notificationRoutes;
