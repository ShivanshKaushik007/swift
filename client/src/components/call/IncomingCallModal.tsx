// @ts-nocheck
import React from "react";
import { useWebRTC } from "@/context/WebRTCContext";
import { FiPhone, FiPhoneOff, FiVideo, FiMic, FiMicOff, FiVideoOff } from "react-icons/fi";

const IncomingCallModal = () => {
  const { callData, answerCall, rejectCall, callAccepted } = useWebRTC();

  if (!callData || !callData.isReceivingCall || callAccepted) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#1e1e2e] p-8 rounded-2xl flex flex-col items-center gap-6 shadow-2xl border border-[#2a2a3c] animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-[#8417ff]/20 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-20 h-20 bg-[#8417ff] rounded-full flex items-center justify-center text-3xl font-bold text-white">
            {callData.name?.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{callData.name}</h2>
          <p className="text-neutral-400 capitalize">
            Incoming {callData.type} call...
          </p>
        </div>

        <div className="flex items-center gap-8 mt-4">
          <button
            onClick={rejectCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg shadow-red-500/20"
          >
            <FiPhoneOff size={24} />
          </button>
          
          <button
            onClick={answerCall}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg shadow-green-500/20 animate-bounce"
          >
            {callData.type === "video" ? <FiVideo size={24} /> : <FiPhone size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
