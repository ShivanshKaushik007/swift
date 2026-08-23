import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./ErrorHandler";
import User from "../models/UserModel";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError("You are not authenticated.", 401));

  jwt.verify(token, process.env.JWT_KEY as string, async (err: any, payload: any) => {
    if (err) return next(new AppError("Token is not valid!", 403));
    req.userId = payload.userId;
    
    // Update last active time (fire and forget to not block request)
    User.findByIdAndUpdate(payload.userId, { lastActiveAt: new Date() }).catch(e => console.error("Error updating lastActiveAt", e));
    
    next();
  });
};

export const verifySuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isSuperAdmin) {
      return next(new AppError("Unauthorized. Super Admin access required.", 403));
    }
    next();
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
