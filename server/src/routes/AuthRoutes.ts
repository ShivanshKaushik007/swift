import { Router } from "express";
import {
  getUserInfo,
  login,
  signup,
  updateProfile,
  addProfileImage,
  removeProfileImage,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  oauthCallback
} from "../controllers/AuthController";
import passport from "passport";
import { verifyToken } from "../middleware/AuthMiddleware";
import multer from "multer";

const authRoutes = Router();
const upload = multer({ dest: "uploads/profiles/" });
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/refresh-token", refreshToken);
authRoutes.get("/user-info", verifyToken, getUserInfo);
authRoutes.post("/update-profile", verifyToken, updateProfile);
authRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"),
  addProfileImage
);
authRoutes.delete("/remove-profile-image", verifyToken, removeProfileImage);
authRoutes.post("/logout", logout);

authRoutes.get("/oauth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRoutes.get("/oauth/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/auth?error=GoogleOAuthFailed" }), oauthCallback);

authRoutes.get("/oauth/github", passport.authenticate("github", { scope: ["user:email"] }));
authRoutes.get("/oauth/github/callback", passport.authenticate("github", { session: false, failureRedirect: "/auth?error=GitHubOAuthFailed" }), oauthCallback);

export default authRoutes;
