import { Request, Response } from "express";
import { workspaceService } from "../services/WorkspaceService";

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, image } = req.body;
    // @ts-ignore
    const userId = req.userId;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const workspace = await workspaceService.createWorkspace(userId as string, name, image);
    return res.status(201).json({ workspace });
  } catch (error: any) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserWorkspaces = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const workspaces = await workspaceService.getUserWorkspaces(userId as string);
    return res.status(200).json({ workspaces });
  } catch (error: any) {
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getWorkspaceDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.userId;
    const workspace = await workspaceService.getWorkspaceDetails(id as string, userId as string);
    return res.status(200).json({ workspace });
  } catch (error: any) {
    if (error.message === "Workspace not found or unauthorized") {
      return res.status(404).send(error.message);
    }
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const createInviteLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.userId;
    const { maxUses, expiresInDays } = req.body;
    
    const invite = await workspaceService.createInviteLink(id as string, userId as string, maxUses, expiresInDays);
    return res.status(200).json({ invite });
  } catch (error: any) {
    if (error.message === "Unauthorized") return res.status(403).send(error.message);
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const joinWorkspace = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    // @ts-ignore
    const userId = req.userId;
    
    const workspace = await workspaceService.joinWorkspace(code as string, userId as string);
    return res.status(200).json({ workspace });
  } catch (error: any) {
    if (error.message === "Invalid or expired invite code") return res.status(400).send(error.message);
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.userId;
    const logs = await workspaceService.getAuditLogs(id as string, userId as string);
    return res.status(200).json({ logs });
  } catch (error: any) {
    if (error.message === "Unauthorized") return res.status(403).send(error.message);
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { id, targetUserId } = req.params;
    const { role } = req.body;
    // @ts-ignore
    const adminId = req.userId;
    
    const workspace = await workspaceService.updateMemberRole(id as string, adminId as string, targetUserId as string, role);
    return res.status(200).json({ workspace });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Only owner")) return res.status(403).send(error.message);
    if (error.message === "Member not found") return res.status(404).send(error.message);
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};

export const kickMember = async (req: Request, res: Response) => {
  try {
    const { id, targetUserId } = req.params;
    // @ts-ignore
    const adminId = req.userId;
    
    const workspace = await workspaceService.kickMember(id as string, adminId as string, targetUserId as string);
    return res.status(200).json({ workspace });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Only owner")) return res.status(403).send(error.message);
    if (error.message === "Member not found") return res.status(404).send(error.message);
    console.log({ error });
    return res.status(500).send("Internal Server Error");
  }
};
