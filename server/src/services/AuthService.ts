import UserRepository from "../repositories/UserRepository";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";

export class AuthService {
  private accessMaxAge = 15 * 60 * 1000; // 15 mins
  private refreshMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  createAccessToken(email: string, userId: string): string {
    return jwt.sign({ email, userId }, process.env.JWT_KEY as string, {
      expiresIn: "15m",
    });
  }

  createRefreshToken(email: string, userId: string): string {
    return jwt.sign({ email, userId, isRefreshToken: true }, process.env.JWT_KEY as string, {
      expiresIn: "7d",
    });
  }

  async signup(email: string, password: string):Promise<{user: any, accessToken: string, refreshToken: string, refreshMaxAge: number}> {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await UserRepository.create({ 
      email, 
      password,
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
    });

    // Mock sending email
    await sendEmail({
      to: email,
      subject: "Welcome! Please verify your email.",
      text: `Click the link to verify your email: ${process.env.ORIGIN}/verify-email?token=${verificationToken}`,
    });

    const accessToken = this.createAccessToken(email, user.id);
    const refreshToken = this.createRefreshToken(email, user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        isEmailVerified: user.isEmailVerified
      },
      accessToken,
      refreshToken,
      refreshMaxAge: this.refreshMaxAge
    };
  }

  async login(email: string, password: string): Promise<{user: any, accessToken: string, refreshToken: string, refreshMaxAge: number}> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("User with the given email is not found.");
    }
    if (user.authProvider !== 'local') {
      throw new Error(`This account uses ${user.authProvider} to login.`);
    }
    const auth = await compare(password, user.password as string);
    if (!auth) {
      throw new Error("Password is incorrect.");
    }
    const accessToken = this.createAccessToken(email, user.id);
    const refreshToken = this.createRefreshToken(email, user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        isEmailVerified: user.isEmailVerified,
        starredMessages: user.starredMessages || []
      },
      accessToken,
      refreshToken,
      refreshMaxAge: this.refreshMaxAge
    };
  }

  async getUserInfo(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User with the given id not found.");
    }
    return {
      id: user.id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
      isEmailVerified: user.isEmailVerified,
      starredMessages: user.starredMessages || []
    };
  }

  async verifyEmail(token: string) {
    const user = await UserRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error("Invalid or expired verification token.");
    }
    await UserRepository.updateById(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });
  }

  async forgotPassword(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found.");
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await UserRepository.updateById(user.id, { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires });
    
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      text: `Reset your password here: ${process.env.ORIGIN}/reset-password?token=${resetToken}`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await UserRepository.findByResetPasswordToken(token);
    if (!user) {
      throw new Error("Invalid or expired password reset token.");
    }
    
    // We update the password directly. The pre('save') hook in UserModel
    // will hash it, but wait! UserRepository.updateById uses findByIdAndUpdate which bypasses pre('save') by default,
    // so we must hash it here or use user.save().
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  async updateProfile(userId: string, firstName: string, lastName: string, color: number) {
    const user = await UserRepository.updateById(userId, { firstName, lastName, color, profileSetup: true });
    if (!user) throw new Error("User not found");
    return {
      id: user.id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
    };
  }

  async addProfileImage(userId: string, file: Express.Multer.File) {
    const date = Date.now();
    const fileName = "uploads/profiles/" + date + file.originalname;
    renameSync(file.path, fileName);
    const updatedUser = await UserRepository.updateById(userId, { image: fileName });
    if (!updatedUser) throw new Error("User not found");
    return { image: updatedUser.image };
  }

  async removeProfileImage(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (user.image) {
      try {
        unlinkSync(user.image);
      } catch (e) {
        console.error("Could not delete image file", e);
      }
    }
    await UserRepository.updateById(userId, { image: "" });
  }
}

export default new AuthService();
