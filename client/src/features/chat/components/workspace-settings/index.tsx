// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { FiX, FiLink, FiUsers, FiShield, FiMoreVertical } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { WORKSPACES_ROUTES } from "@/utils/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import moment from "moment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WorkspaceSettingsModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { activeWorkspaceData, setActiveWorkspaceData, userInfo } = useAppStore();
  const [activeTab, setActiveTab] = useState("members");
  const [inviteLink, setInviteLink] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (activeTab === "audit" && activeWorkspaceData) {
      const fetchLogs = async () => {
        try {
          const res = await apiClient.get(`${WORKSPACES_ROUTES}/${activeWorkspaceData._id}/audit`, { withCredentials: true });
          setAuditLogs(res.data.logs);
        } catch (error) {
          toast.error("Failed to load audit logs. Are you an admin?");
        }
      };
      fetchLogs();
    }
  }, [activeTab, activeWorkspaceData]);

  const generateInvite = async () => {
    try {
      const res = await apiClient.post(`${WORKSPACES_ROUTES}/${activeWorkspaceData._id}/invite`, {
        maxUses: 10,
        expiresInDays: 7
      }, { withCredentials: true });
      setInviteLink(res.data.invite.code);
      toast.success("Invite link generated!");
      setActiveWorkspaceData({
        ...activeWorkspaceData,
        inviteLinks: [...(activeWorkspaceData.inviteLinks || []), res.data.invite]
      });
    } catch (error) {
      toast.error("Failed to generate invite link. Are you an admin?");
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      const res = await apiClient.put(`${WORKSPACES_ROUTES}/${activeWorkspaceData._id}/members/${targetUserId}/role`, { role: newRole }, { withCredentials: true });
      setActiveWorkspaceData(res.data.workspace);
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(error.response?.data || "Failed to update role");
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    if (!window.confirm("Are you sure you want to kick this member?")) return;
    try {
      const res = await apiClient.delete(`${WORKSPACES_ROUTES}/${activeWorkspaceData._id}/members/${targetUserId}`, { withCredentials: true });
      setActiveWorkspaceData(res.data.workspace);
      toast.success("Member kicked successfully");
    } catch (error) {
      toast.error(error.response?.data || "Failed to kick member");
    }
  };

  if (!activeWorkspaceData) return null;

  const myRole = activeWorkspaceData.members.find((m: any) => m.user._id === userInfo.id)?.role;
  const isAdmin = myRole === 'admin' || myRole === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181920] border-[#2a2a3c] text-white w-[600px] h-[600px] flex flex-col p-0 overflow-hidden max-w-none">
        <div className="flex h-full w-full">
          {/* Sidebar */}
          <div className="w-48 bg-[#1e1e2e] h-full p-4 flex flex-col gap-2 border-r border-[#2a2a3c]">
            <h2 className="text-xl font-bold mb-4 px-2">{activeWorkspaceData.name}</h2>
            <button onClick={() => setActiveTab("members")} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${activeTab === 'members' ? 'bg-[#2a2a3c] text-white' : 'text-neutral-400 hover:bg-[#2a2a3c]/50'}`}>
              <FiUsers /> Members
            </button>
            <button onClick={() => setActiveTab("invites")} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${activeTab === 'invites' ? 'bg-[#2a2a3c] text-white' : 'text-neutral-400 hover:bg-[#2a2a3c]/50'}`}>
              <FiLink /> Invites
            </button>
            <button onClick={() => setActiveTab("audit")} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${activeTab === 'audit' ? 'bg-[#2a2a3c] text-white' : 'text-neutral-400 hover:bg-[#2a2a3c]/50'}`}>
              <FiShield /> Audit Logs
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'members' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Workspace Members</h3>
                <div className="flex flex-col gap-3">
                  {activeWorkspaceData.members.map((m: any) => (
                    <div key={m.user._id} className="flex justify-between items-center bg-[#2a2a3c] p-3 rounded">
                      <div>
                        <div className="font-semibold">{m.user.firstName} {m.user.lastName}</div>
                        <div className="text-xs text-neutral-400">{m.user.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm px-2 py-1 bg-[#1e1e2e] rounded uppercase text-neutral-300">
                          {m.role}
                        </div>
                        {isAdmin && m.user._id !== userInfo.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <FiMoreVertical className="text-neutral-400 hover:text-white cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1e1e2e] border-[#2a2a3c] text-white">
                              {myRole === 'owner' && m.role !== 'owner' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleRoleChange(m.user._id, 'admin')} className="cursor-pointer hover:bg-[#2a2a3c]">Make Admin</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRoleChange(m.user._id, 'member')} className="cursor-pointer hover:bg-[#2a2a3c]">Make Member</DropdownMenuItem>
                                </>
                              )}
                              {myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin' && (
                                <DropdownMenuItem onClick={() => handleRoleChange(m.user._id, 'member')} className="cursor-pointer hover:bg-[#2a2a3c]">Make Member</DropdownMenuItem>
                              )}
                              {(myRole === 'owner' || (myRole === 'admin' && m.role !== 'admin' && m.role !== 'owner')) && (
                                <DropdownMenuItem onClick={() => handleKickMember(m.user._id)} className="cursor-pointer text-red-500 hover:bg-red-500/10">Kick Member</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invites' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Invite Links</h3>
                {isAdmin ? (
                  <Button onClick={generateInvite} className="bg-[#8417ff] hover:bg-[#6c12d4] mb-4">
                    Generate New Link
                  </Button>
                ) : (
                  <p className="text-sm text-neutral-400 mb-4">Only admins can generate invite links.</p>
                )}
                {inviteLink && (
                  <div className="p-4 bg-[#2a2a3c] rounded mb-4">
                    <p className="text-sm text-neutral-400 mb-2">Share this code with others:</p>
                    <code className="text-xl font-mono text-[#8417ff]">{inviteLink}</code>
                  </div>
                )}
                
                <h4 className="font-semibold mb-2 mt-6">Active Links</h4>
                <div className="flex flex-col gap-2">
                  {activeWorkspaceData.inviteLinks?.map((link: any) => (
                    <div key={link._id || link.code} className="bg-[#2a2a3c] p-3 rounded flex justify-between">
                      <code className="text-[#8417ff]">{link.code}</code>
                      <div className="text-xs text-neutral-400">Uses: {link.uses} / {link.maxUses || '∞'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Audit Logs</h3>
                {!isAdmin ? (
                  <p className="text-sm text-neutral-400">Only admins can view audit logs.</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-neutral-400">No logs found.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {auditLogs.map((log: any) => (
                      <div key={log._id} className="bg-[#2a2a3c] p-3 rounded flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm">
                            {log.actor?.firstName} {log.actor?.lastName}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {moment(log.createdAt).fromNow()}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-300">
                          {log.action}
                        </span>
                        {log.details && (
                          <pre className="text-xs text-neutral-500 mt-1 bg-[#181920] p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceSettingsModal;
