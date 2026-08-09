import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware";
import { 
  getMessages, 
  getThreadMessages,
  uploadFile,
  editMessage,
  deleteMessage,
  reactToMessage,
  pinMessage,
  starMessage,
  markAsRead
} from "../controllers/MessagesController";
import { uploadAttachment } from "../config/cloudinary";

const messagesRoutes = Router();

messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.get("/thread/:id", verifyToken, getThreadMessages);
messagesRoutes.post("/upload-file", verifyToken, uploadAttachment.single("file"), uploadFile);

messagesRoutes.patch("/:id/edit", verifyToken, editMessage);
messagesRoutes.delete("/:id/delete", verifyToken, deleteMessage);
messagesRoutes.post("/:id/react", verifyToken, reactToMessage);
messagesRoutes.post("/:id/pin", verifyToken, pinMessage);
messagesRoutes.post("/:id/star", verifyToken, starMessage);
messagesRoutes.post("/mark-read", verifyToken, markAsRead);
export default messagesRoutes;
