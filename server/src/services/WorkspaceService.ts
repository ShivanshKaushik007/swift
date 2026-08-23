import Workspace from "../models/WorkspaceModel";
import User from "../models/UserModel";
import AuditLog from "../models/AuditLogModel";
import { v4 as uuidv4 } from 'uuid';
import mongoose from "mongoose";

class WorkspaceService {
  async createWorkspace(userId: string, name: string, image?: string) {
    const workspace = new Workspace({
      name,
      image,
      owner: userId,
      members: [
        {
          user: userId,
          role: 'owner',
        }
      ]
    });
    await workspace.save();

    await User.findByIdAndUpdate(userId, {
      $push: { workspaces: workspace._id }
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    const user = await User.findById(userId).populate({
      path: 'workspaces',
      select: 'name image owner channels'
    });
    return user?.workspaces || [];
  }

  async getWorkspaceDetails(workspaceId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId)
      .populate('members.user', 'firstName lastName email image color')
      .populate('channels');
    
    if (!workspace) throw new Error("Workspace not found or unauthorized");
    
    const isMember = workspace.members.some(m => m.user._id.toString() === userId);
    if (!isMember) throw new Error("Workspace not found or unauthorized");

    return workspace;
  }

  async createInviteLink(workspaceId: string, userId: string, maxUses?: number, expiresInDays?: number) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const member = workspace.members.find(m => m.user.toString() === userId);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new Error("Unauthorized");
    }

    const code = uuidv4().substring(0, 8); // simple code
    let expiresAt;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const newInvite = {
      code,
      expiresAt,
      maxUses,
      uses: 0
    };

    workspace.inviteLinks.push(newInvite);
    await workspace.save();

    await AuditLog.create({
      workspaceId,
      actor: userId,
      action: 'INVITE_LINK_CREATED',
      details: { code, maxUses, expiresAt }
    });

    return newInvite;
  }

  async joinWorkspace(code: string, userId: string) {
    const workspace = await Workspace.findOne({ "inviteLinks.code": code });
    if (!workspace) throw new Error("Invalid or expired invite code");

    const inviteIndex = workspace.inviteLinks.findIndex(i => i.code === code);
    const invite = workspace.inviteLinks[inviteIndex];

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new Error("Invalid or expired invite code");
    }
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new Error("Invalid or expired invite code");
    }

    const isMember = workspace.members.some(m => m.user.toString() === userId);
    if (isMember) {
      return workspace; // Already a member
    }

    workspace.members.push({ user: userId as any, role: 'member', joinedAt: new Date() });
    workspace.inviteLinks[inviteIndex].uses += 1;
    await workspace.save();

    await User.findByIdAndUpdate(userId, {
      $push: { workspaces: workspace._id }
    });

    await AuditLog.create({
      workspaceId: workspace._id,
      actor: userId,
      action: 'MEMBER_JOINED',
      details: { code }
    });

    return workspace;
  }
}

export const workspaceService = new WorkspaceService();
