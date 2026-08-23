// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { useWebRTC } from "@/context/WebRTCContext";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from "react-icons/fi";

const CallScreen = () => {
  const {
    isCalling,
    callAccepted,
    localStream,
    remoteStream,
    leaveCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
    callData
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isCalling && !callAccepted) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
      
      {/* Remote Video (Main Screen) */}
      <div className="relative w-full max-w-6xl h-[70vh] bg-[#181920] rounded-2xl overflow-hidden shadow-2xl border border-[#2a2a3c]">
        {!callAccepted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-[#8417ff]/20 rounded-full flex items-center justify-center animate-pulse mb-6">
              <div className="w-20 h-20 bg-[#8417ff] rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {/* Fallback to 'C' for Calling if we don't know the remote user yet */}
                {callData?.name?.charAt(0).toUpperCase() || '📞'}
              </div>
            </div>
            <h2 className="text-2xl text-white font-semibold">Calling...</h2>
          </div>
        ) : (
          remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
               Connecting...
             </div>
          )
        )}

        {/* Local Video (PiP) */}
        {localStream && !isVideoOff && (
          <div className="absolute bottom-6 right-6 w-48 h-64 bg-black rounded-xl overflow-hidden border-2 border-[#2a2a3c] shadow-xl z-10">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center gap-6 bg-[#1e1e2e] py-4 px-8 rounded-full border border-[#2a2a3c]">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-[#2a2a3c] text-white hover:bg-[#3a3a4c]"
          }`}
        >
          {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-[#2a2a3c] text-white hover:bg-[#3a3a4c]"
          }`}
        >
          {isVideoOff ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
        </button>

        <button
          onClick={leaveCall}
          className="w-16 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ml-4"
        >
          <FiPhoneOff size={20} />
        </button>
      </div>

    </div>
  );
};

export default CallScreen;
