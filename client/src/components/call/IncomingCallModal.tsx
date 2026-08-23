// @ts-nocheck
import React from "react";
import { useWebRTC } from "@/context/WebRTCContext";
import { FiPhone, FiPhoneOff, FiVideo, FiMic, FiMicOff, FiVideoOff } from "react-icons/fi";

const IncomingCallModal = () => {
  const { callData, answerCall, rejectCall, callAccepted } = useWebRTC();

  if (!callData || !callData.isReceivingCall || callAccepted) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-md">
      <div className="bg-gradient-to-b from-[#1e1e2e] to-[#181920] p-10 rounded-3xl flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(132,23,255,0.15)] border border-[#2a2a3c] animate-in zoom-in-95 duration-300">
        <div className="relative">
          {/* Outer ripples */}
          <div className="absolute inset-0 bg-[#8417ff]/20 rounded-full animate-ping scale-150" />
          <div className="w-28 h-28 bg-[#8417ff]/30 rounded-full flex items-center justify-center animate-pulse relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-[#8417ff] to-[#5a0fb3] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {callData.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">{callData.name}</h2>
          <p className="text-neutral-400 capitalize tracking-widest text-sm font-medium">
            INCOMING {callData.type} CALL...
          </p>
        </div>

        <div className="flex items-center gap-12 mt-4">
          <button
            onClick={rejectCall}
            className="w-16 h-16 bg-red-500/10 hover:bg-red-500 rounded-full flex items-center justify-center text-red-500 hover:text-white transition-all duration-300 shadow-lg border border-red-500/50 hover:border-red-500"
          >
            <FiPhoneOff size={28} />
          </button>
          
          <button
            onClick={answerCall}
            className="w-16 h-16 bg-[#8417ff] hover:bg-[#6c12d4] rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-[0_0_20px_rgba(132,23,255,0.5)] hover:shadow-[0_0_30px_rgba(132,23,255,0.8)] animate-bounce"
          >
            {callData.type === "video" ? <FiVideo size={28} /> : <FiPhone size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
