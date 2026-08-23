import mongoose, { Document, Model } from "mongoose";

export interface IChannel extends Document {
  name: string;
  workspaceId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  admin: mongoose.Types.ObjectId;
  messages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new mongoose.Schema<IChannel>({
  name: {
    type: String,
    required: true,
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspaces",
    required: true,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  messages: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Messages", required: false },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

channelSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

channelSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

channelSchema.index({ name: 'text' });

const Channel: Model<IChannel> = mongoose.model<IChannel>("Channels", channelSchema);
export default Channel;
