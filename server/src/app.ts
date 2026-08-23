import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// @ts-ignore
import xss from "xss-clean";
import passport from "./config/passport";
import contactsRoutes from "./routes/ContactRoutes";
import setupSocket from "./socket";
import messagesRoutes from "./routes/MessagesRoutes";
import searchRoutes from "./routes/SearchRoutes";
import notificationRoutes from "./routes/NotificationRoutes";
import workspaceRoutes from "./routes/WorkspaceRoutes";
import channelRoutes from "./routes/ChannelRoutes";
import adminRoutes from "./routes/AdminRoutes";
import { errorHandler } from "./middleware/ErrorHandler";
import { startScheduledMessagesJob } from "./jobs/scheduledMessages";

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://swift-qko3.onrender.com"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Rate Limiting for all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

// Prevent XSS attacks
app.use(xss());

app.use(passport.initialize());

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contacts", contactsRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

setupSocket(server);
startScheduledMessagesJob();

if (databaseURL) {
  mongoose
    .connect(databaseURL)
    .then(() => console.log("DB connection Successful."))
    .catch((err) => console.log(err.message));
} else {
    // using the original db url fallback since it was in the code
    mongoose
    .connect("mongodb+srv://shivanshkaushik1237:jebn3B0cBlg3ep9t@syncronus-chat-app.ndoj5.mongodb.net/?retryWrites=true&w=majority&appName=syncronus-chat-app")
    .then(() => console.log("DB connection Successful. (Fallback URL)"))
    .catch((err) => console.log(err.message));
}
