import { Request, Response, NextFunction } from "express";
import authService from "../services/AuthService";
import { signupSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/AuthSchema";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;
    const result = await authService.signup(email, password);
    
    res.cookie("accessToken", result.accessToken, {
      maxAge: 15 * 60 * 1000,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", result.refreshToken, {
      maxAge: result.refreshMaxAge,
      secure: true,
      sameSite: "none",
      httpOnly: true // Refresh token should be HttpOnly
    });
    return res.status(201).json({ user: result.user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;
    const result = await authService.login(email, password);
    
    res.cookie("accessToken", result.accessToken, {
      maxAge: 15 * 60 * 1000,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", result.refreshToken, {
      maxAge: result.refreshMaxAge,
      secure: true,
      sameSite: "none",
      httpOnly: true
    });
    return res.status(200).json({ user: result.user });
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("incorrect")) {
      return res.status(400).send(error.message);
    }
    next(error);
  }
};

export const getUserInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) return res.status(400).send("User ID missing");
    const user = await authService.getUserInfo(req.userId);
    return res.status(200).json(user);
  } catch (error: any) {
    if (error.message.includes("not found")) return res.status(404).send(error.message);
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send("Token is required");
    await authService.verifyEmail(token);
    return res.status(200).send("Email verified successfully");
  } catch (error: any) {
    if (error.message.includes("Invalid")) return res.status(400).send(error.message);
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    await authService.forgotPassword(parsed.data.email);
    return res.status(200).send("Password reset email sent if account exists.");
  } catch (error: any) {
    if (error.message.includes("not found")) {
      // Don't leak user existence
      return res.status(200).send("Password reset email sent if account exists.");
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    await authService.resetPassword(parsed.data.token, parsed.data.newPassword);
    return res.status(200).send("Password reset successfully.");
  } catch (error: any) {
    if (error.message.includes("Invalid")) return res.status(400).send(error.message);
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!userId) return res.status(400).send("User ID missing");
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { firstName, lastName, color } = parsed.data;

    const updatedUser = await authService.updateProfile(userId, firstName, lastName, color);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const addProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");
    if (!req.file) {
      return res.status(400).send("File is required.");
    }

    const result = await authService.addProfileImage(userId, req.file);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).send("User ID missing");

    await authService.removeProfileImage(userId);
    return res.status(200).send("Profile image removed successfully.");
  } catch (error: any) {
    if (error.message.includes("not found")) return res.status(404).send(error.message);
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie("accessToken", "", { maxAge: 1, secure: true, sameSite: "none" });
    res.cookie("refreshToken", "", { maxAge: 1, secure: true, sameSite: "none", httpOnly: true });
    return res.status(200).send("Logout successful.");
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).send("No refresh token provided");

    const decoded = require("jsonwebtoken").verify(token, process.env.JWT_KEY) as { email: string; userId: string; isRefreshToken: boolean };
    if (!decoded.isRefreshToken) return res.status(400).send("Invalid refresh token");

    const newAccessToken = authService.createAccessToken(decoded.email, decoded.userId);
    res.cookie("accessToken", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      secure: true,
      sameSite: "none",
    });
    return res.status(200).send("Token refreshed");
  } catch (error: any) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).send("Refresh token expired or invalid");
    }
    next(error);
  }
};

export const oauthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${process.env.ORIGIN}/auth?error=OAuthFailed`);
    }

    const email = user.email;
    const userId = user.id || user._id;

    const accessToken = authService.createAccessToken(email, userId);
    const refreshToken = authService.createRefreshToken(email, userId);

    res.cookie("accessToken", accessToken, {
      maxAge: 15 * 60 * 1000,
      secure: true,
      sameSite: "none",
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "none",
      httpOnly: true,
    });

    res.redirect(`${process.env.ORIGIN}/chat`);
  } catch (error) {
    next(error);
  }
};
