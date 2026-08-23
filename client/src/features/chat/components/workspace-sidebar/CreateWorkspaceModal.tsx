import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { WORKSPACES_ROUTES } from "@/utils/constants";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { FiX } from "react-icons/fi";

const CreateWorkspaceModal = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState("");
  const { setWorkspaces, workspaces, setActiveWorkspace } = useAppStore();

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Workspace name is required.");
    try {
      const response = await apiClient.post(
        `${WORKSPACES_ROUTES}/create`,
        { name },
        { withCredentials: true }
      );
      if (response.status === 201) {
        toast.success("Workspace created!");
        const newWorkspace = response.data.workspace;
        setWorkspaces([...workspaces, newWorkspace]);
        setActiveWorkspace(newWorkspace);
        onClose();
      }
    } catch (error) {
      toast.error("Failed to create workspace.");
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
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Customize your workspace</h2>
        <p className="text-neutral-400 text-sm mb-6 text-center">
          Give your new workspace a personality with a name. You can always change it later.
        </p>
        <div className="flex flex-col gap-2 mb-6">
          <label className="text-xs font-bold text-neutral-300 uppercase">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#2a2a3c] border-none text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#8417ff]"
            placeholder="My Awesome Workspace"
          />
        </div>
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="text-neutral-400 hover:underline">
            Back
          </button>
          <button
            onClick={handleCreate}
            className="bg-[#8417ff] hover:bg-[#6c12d4] text-white px-6 py-2 rounded font-semibold transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
