import mongoose, { Document, Model } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: "mention" | "system";
  channelId?: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  type: {
    type: String,
    enum: ["mention", "system"],
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channels",
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Messages",
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notifications",
  notificationSchema
);

export default Notification;
