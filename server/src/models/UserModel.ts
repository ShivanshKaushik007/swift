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