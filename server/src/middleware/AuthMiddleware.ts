import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./ErrorHandler";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError("You are not authenticated.", 401));

  jwt.verify(token, process.env.JWT_KEY as string, (err: any, payload: any) => {
    if (err) return next(new AppError("Token is not valid!", 403));
    req.userId = payload.userId;
    next();
  });
};
