import User, { IUser } from "../models/UserModel";
import { UpdateQuery } from "mongoose";

class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return await user.save();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByOAuthId(oauthId: string): Promise<IUser | null> {
    return await User.findOne({ oauthId });
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return await User.findOne({ emailVerificationToken: token });
  }

  async findByResetPasswordToken(token: string): Promise<IUser | null> {
    return await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: new Date() } 
    });
  }

  async updateById(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async searchContacts(userId: string, regex: RegExp): Promise<IUser[]> {
    return await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        },
      ],
    });
  }

  async getAllContacts(userId: string): Promise<IUser[]> {
    return await User.find(
      { _id: { $ne: userId } },
      "firstName lastName _id email"
    );
  }
}

export default new UserRepository();
