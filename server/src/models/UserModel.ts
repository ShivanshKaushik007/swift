import mongoose, { Document, Model } from "mongoose";
import { genSalt, hash } from "bcrypt";

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  color?: number;
  profileSetup: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  authProvider: 'local' | 'google' | 'github';
  oauthId?: string;
  starredMessages: mongoose.Types.ObjectId[];
  drafts: { channelOrUser: mongoose.Types.ObjectId; content: string; updatedAt: Date }[];
  workspaces: mongoose.Types.ObjectId[];
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: [true, "Email is Required."],
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  color: {
    type: Number,
    required: false,
  },
  profileSetup: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    required: false,
  },
  resetPasswordToken: {
    type: String,
    required: false,
  },
  resetPasswordExpires: {
    type: Date,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local',
  },
  oauthId: {
    type: String,
    required: false,
  },
  starredMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Messages" }],
  drafts: [
    {
      channelOrUser: { type: mongoose.Schema.Types.ObjectId, required: true },
      content: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now },
    },
  ],
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspaces" }],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await genSalt();
    this.password = await hash(this.password, salt);
  }
  next();
});

const User: Model<IUser> = mongoose.model<IUser>("Users", userSchema);
export default User;