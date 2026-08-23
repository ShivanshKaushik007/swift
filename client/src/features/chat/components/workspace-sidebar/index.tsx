// @ts-nocheck
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FiHome, FiPlus, FiLogIn } from "react-icons/fi";
import { getImageUrl } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { WORKSPACES_ROUTES } from "@/utils/constants";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import JoinWorkspaceModal from "./JoinWorkspaceModal";

const WorkspaceSidebar = () => {
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useAppStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await apiClient.get(`${WORKSPACES_ROUTES}/mine`, { withCredentials: true });
        setWorkspaces(response.data.workspaces);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };
    fetchWorkspaces();
  }, [setWorkspaces]);

  return (
    <div className="w-[72px] h-full bg-[#1e1e2e] flex flex-col items-center py-4 border-r border-[#2a2a3c] gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={() => setActiveWorkspace(null)}
              className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer bg-[#2a2a3c] text-white hover:bg-[#8417ff] ${
                activeWorkspace === null ? "bg-[#8417ff] rounded-[16px]" : ""
              }`}
            >
              <FiHome className="text-2xl" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white">
            <p>Direct Messages</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-8 h-[2px] bg-[#2a2a3c] rounded-full my-1" />

        {workspaces.map((workspace: any) => (
          <Tooltip key={workspace._id}>
            <TooltipTrigger>
              <div
                onClick={() => setActiveWorkspace(workspace)}
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer bg-[#2a2a3c] text-white overflow-hidden relative ${
                  activeWorkspace?._id === workspace._id ? "rounded-[16px] border-2 border-[#8417ff]" : ""
                }`}
              >
                {workspace.image ? (
                  <img src={getImageUrl(workspace.image)} alt={workspace.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="uppercase text-lg font-bold">{workspace.name.charAt(0)}</span>
                )}
                {activeWorkspace?._id === workspace._id && (
                  <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>{workspace.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer bg-[#2a2a3c] text-green-500 hover:bg-green-500 hover:text-white"
            >
              <FiPlus className="text-2xl" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white">
            <p>Add a Workspace</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={() => setIsJoinModalOpen(true)}
              className="w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer bg-[#2a2a3c] text-blue-500 hover:bg-blue-500 hover:text-white"
            >
              <FiLogIn className="text-2xl" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none text-white">
            <p>Join a Workspace</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isCreateModalOpen && (
        <CreateWorkspaceModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      {isJoinModalOpen && (
        <JoinWorkspaceModal onClose={() => setIsJoinModalOpen(false)} />
      )}
    </div>
  );
};

export default WorkspaceSidebar;
