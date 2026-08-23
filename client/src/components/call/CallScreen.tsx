// @ts-nocheck
import React, { useEffect, useRef } from "react";
import { useWebRTC } from "@/context/WebRTCContext";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from "react-icons/fi";
import { useAppStore } from "@/store";
import { getImageUrl } from "@/lib/utils";

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

  const { selectedChatData } = useAppStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // If we are calling, use selectedChatData. If receiving, use callData.
  const remoteName = callData?.name || (selectedChatData?.firstName ? `${selectedChatData.firstName} ${selectedChatData.lastName}` : selectedChatData?.email) || "Unknown";
  const remoteImageRaw = callData?.avatar || selectedChatData?.image;
  const remoteImage = remoteImageRaw ? getImageUrl(remoteImageRaw) : null;

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
            <div className="w-32 h-32 bg-[#8417ff]/20 rounded-full flex items-center justify-center animate-pulse mb-6 overflow-hidden">
              {remoteImage ? (
                <img src={remoteImage} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-28 h-28 bg-[#8417ff] rounded-full flex items-center justify-center text-5xl font-bold text-white">
                  {remoteName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-2xl text-white font-semibold">Calling {remoteName}...</h2>
          </div>
        ) : (
          <>
            {/* We show the remote stream if it exists. But if the remote user has their camera off, the stream might be empty or missing video tracks. 
                For now, if there is no remoteStream, we show the avatar. 
                WebRTC actually sends black frames when video is disabled natively, but if we don't have remoteStream yet, we show this. */}
            <video
              ref={remoteVideoRef}
              autoPlay
              className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                <div className="w-32 h-32 bg-[#8417ff]/20 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  {remoteImage ? (
                    <img src={remoteImage} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-28 h-28 bg-[#8417ff] rounded-full flex items-center justify-center text-5xl font-bold text-white">
                      {remoteName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                Connecting video...
              </div>
            )}
          </>
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
