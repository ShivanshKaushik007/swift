import mongoose, { Document, Model } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId;
  channelId?: mongoose.Types.ObjectId;
  messageType: "text" | "file";
  content?: string;
  attachments?: { type: string; url: string; name: string; size: number }[];
  timestamp: Date;
  readBy: { user: mongoose.Types.ObjectId; readAt: Date }[];
  replyTo?: mongoose.Types.ObjectId;
  threadId?: mongoose.Types.ObjectId;
  reactions: { emoji: string; users: mongoose.Types.ObjectId[] }[];
  mentions: mongoose.Types.ObjectId[];
  isPinned: boolean;
  isEdited: boolean;
  deletedAt?: Date;
  status: "sent" | "delivered" | "read" | "scheduled" | "draft";
  scheduledAt?: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channels",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  content: {
    type: String,
    required: function (this: IMessage) {
      return this.messageType === "text" && !this.deletedAt;
    },
  },
  attachments: [
    {
      type: { type: String },
      url: { type: String },
      name: { type: String },
      size: { type: Number },
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  readBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      readAt: { type: Date, default: Date.now },
    },
  ],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Messages",
    required: false,
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Messages",
    required: false,
  },
  reactions: [
    {
      emoji: { type: String, required: true },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    },
  ],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read", "scheduled", "draft"],
    default: "sent",
  },
  scheduledAt: {
    type: Date,
    required: false,
  },
});

const Message: Model<IMessage> = mongoose.model<IMessage>("Messages", messageSchema);

export default Message;