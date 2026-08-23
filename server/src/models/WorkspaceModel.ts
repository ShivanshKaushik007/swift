import mongoose, { Document, Model } from "mongoose";

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt: Date;
}

export interface IWorkspaceInvite {
  code: string;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
}

export interface IWorkspace extends Document {
  name: string;
  image?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  channels: mongoose.Types.ObjectId[];
  inviteLinks: IWorkspaceInvite[];
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new mongoose.Schema<IWorkspace>({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
      role: {
        type: String,
        enum: ['owner', 'admin', 'moderator', 'member', 'guest'],
        default: 'member',
      },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  channels: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Channels" }
  ],
  inviteLinks: [
    {
      code: { type: String, required: true },
      expiresAt: { type: Date, required: false },
      maxUses: { type: Number, required: false },
      uses: { type: Number, default: 0 },
    }
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

workspaceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

workspaceSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>("Workspaces", workspaceSchema);
export default Workspace;
