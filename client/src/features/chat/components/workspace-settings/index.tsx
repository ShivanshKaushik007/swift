// @ts-nocheck
import { useState } from "react";
import { useAppStore } from "@/store";
import { FiX, FiLink, FiUsers, FiShield } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { WORKSPACES_ROUTES } from "@/utils/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const WorkspaceSettingsModal = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { activeWorkspaceData } = useAppStore();
  const [activeTab, setActiveTab] = useState("members");
  const [inviteLink, setInviteLink] = useState("");

  const generateInvite = async () => {
    try {
      const res = await apiClient.post(`${WORKSPACES_ROUTES}/${activeWorkspaceData._id}/invite`, {
        maxUses: 10,
        expiresInDays: 7
      }, { withCredentials: true });
      setInviteLink(res.data.invite.code);
      toast.success("Invite link generated!");
    } catch (error) {
      toast.error("Failed to generate invite link. Are you an admin?");
    }
  };

  if (!activeWorkspaceData) return null;

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
                      <div className="text-sm px-2 py-1 bg-[#1e1e2e] rounded uppercase text-neutral-300">
                        {m.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invites' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Invite Links</h3>
                <Button onClick={generateInvite} className="bg-[#8417ff] hover:bg-[#6c12d4] mb-4">
                  Generate New Link
                </Button>
                {inviteLink && (
                  <div className="p-4 bg-[#2a2a3c] rounded mb-4">
                    <p className="text-sm text-neutral-400 mb-2">Share this code with others:</p>
                    <code className="text-xl font-mono text-[#8417ff]">{inviteLink}</code>
                  </div>
                )}
                
                <h4 className="font-semibold mb-2 mt-6">Active Links</h4>
                <div className="flex flex-col gap-2">
                  {activeWorkspaceData.inviteLinks?.map((link: any) => (
                    <div key={link._id} className="bg-[#2a2a3c] p-3 rounded flex justify-between">
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
                <p className="text-sm text-neutral-400">Coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceSettingsModal;
