// @ts-nocheck
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { WORKSPACES_ROUTES } from "@/utils/constants";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { FiX } from "react-icons/fi";

const JoinWorkspaceModal = ({ onClose }: { onClose: () => void }) => {
  const [code, setCode] = useState("");
  const { setWorkspaces, workspaces, setActiveWorkspace } = useAppStore();

  const handleJoin = async () => {
    if (!code.trim()) return toast.error("Invite code is required.");
    try {
      const response = await apiClient.post(
        `${WORKSPACES_ROUTES}/join/${code}`,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        toast.success("Joined workspace!");
        const workspace = response.data.workspace;
        
        // Prevent duplicates
        if (!workspaces.find((w: any) => w._id === workspace._id)) {
          setWorkspaces([...workspaces, workspace]);
        }
        
        setActiveWorkspace(workspace);
        onClose();
      }
    } catch (error) {
      toast.error("Invalid or expired invite code.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#181920] w-[400px] rounded-lg shadow-2xl p-6 border border-[#2a2a3c] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <FiX className="text-2xl" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Join a workspace</h2>
        <p className="text-neutral-400 text-sm mb-6 text-center">
          Enter an invite code below to join an existing workspace.
        </p>
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase">
            Invite Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-[#2a2a3c] border-none text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#8417ff]"
            placeholder="e.g. ab12cd34"
          />
        </div>
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="text-neutral-400 hover:underline">
            Back
          </button>
          <button
            onClick={handleJoin}
            className="bg-[#8417ff] hover:bg-[#6c12d4] text-white px-6 py-2 rounded font-semibold transition-colors"
          >
            Join Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinWorkspaceModal;
