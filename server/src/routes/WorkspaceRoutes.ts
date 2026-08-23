import { Router } from "express";
import { verifyToken } from "../middleware/AuthMiddleware";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  createInviteLink,
  joinWorkspace
} from "../controllers/WorkspaceController";

const workspaceRoutes = Router();

workspaceRoutes.post("/create", verifyToken, createWorkspace);
workspaceRoutes.get("/mine", verifyToken, getUserWorkspaces);
workspaceRoutes.get("/:id", verifyToken, getWorkspaceDetails);
workspaceRoutes.post("/:id/invite", verifyToken, createInviteLink);
workspaceRoutes.post("/join/:code", verifyToken, joinWorkspace);

export default workspaceRoutes;
