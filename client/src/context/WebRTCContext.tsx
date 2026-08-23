// @ts-nocheck
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketContext";
import { useAppStore } from "@/store";
import { toast } from "sonner";

interface CallData {
  isReceivingCall: boolean;
  from: string;
  name: string;
  signal: any;
  type: "audio" | "video";
}

interface WebRTCContextType {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callUser: (idToCall: string, type: "audio" | "video") => void;
  answerCall: () => void;
  rejectCall: () => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isCalling: boolean;
  callAccepted: boolean;
  callEnded: boolean;
  callData: CallData | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error("useWebRTC must be used within WebRTCProvider");
  return context;
};

export const WebRTCProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useSocket();
  const { userInfo } = useAppStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isCalling, setIsCalling] = useState(false);
  const [callData, setCallData] = useState<CallData | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const connectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => {
      setCallData({
        isReceivingCall: true,
        from: data.from,
        name: data.callerName,
        signal: data.signal,
        type: data.type,
      });
    });

    socket.on("call-rejected", () => {
      toast.error("Call was rejected");
      endCallCleanup();
    });

    socket.on("call-ended", () => {
      toast("Call ended");
      endCallCleanup();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-rejected");
      socket.off("call-ended");
    };
  }, [socket]);

  const initLocalStream = async (type: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices", error);
      toast.error("Could not access camera/microphone");
      return null;
    }
  };

  const setupPeerConnection = (stream: MediaStream, peerId: string, isInitiator: boolean) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    // Add local tracks to peer
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    // Handle incoming remote tracks
    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("webrtc-ice-candidate", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    connectionRef.current = peer;
    return peer;
  };

  const callUser = async (idToCall: string, type: "audio" | "video") => {
    const stream = await initLocalStream(type);
    if (!stream) return;

    setIsCalling(true);
    setCallEnded(false);
    setConnectedUser(idToCall);

    const peer = setupPeerConnection(stream, idToCall, true);

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket?.emit("call-user", {
          userToCall: idToCall,
          signalData: peer.localDescription,
          from: userInfo?.id,
          callerName: `${userInfo?.firstName} ${userInfo?.lastName}`,
          type,
        });
      } catch (err) {
        console.error(err);
      }
    };

    // Listen for answer
    socket?.once("call-accepted", async (signal) => {
      setCallAccepted(true);
      await peer.setRemoteDescription(new RTCSessionDescription(signal));
    });

    // Listen for remote ICE candidates
    socket?.on("webrtc-ice-candidate", async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ice candidate", e);
      }
    });
  };

  const answerCall = async () => {
    if (!callData) return;
    setCallAccepted(true);
    setConnectedUser(callData.from);

    const stream = await initLocalStream(callData.type);
    if (!stream) return;

    const peer = setupPeerConnection(stream, callData.from, false);

    // Set remote description from offer
    await peer.setRemoteDescription(new RTCSessionDescription(callData.signal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket?.emit("answer-call", {
      signal: peer.localDescription,
      to: callData.from,
    });

    // Listen for remote ICE candidates
    socket?.on("webrtc-ice-candidate", async (candidate) => {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ice candidate", e);
      }
    });
  };

  const rejectCall = () => {
    if (callData) {
      socket?.emit("reject-call", { to: callData.from });
      setCallData(null);
    }
  };

  const endCallCleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    
    // Clear socket listeners specifically for this call
    socket?.off("call-accepted");
    socket?.off("webrtc-ice-candidate");

    connectionRef.current = null;
    localStreamRef.current = null;
    
    setLocalStream(null);
    setRemoteStream(null);
    setCallEnded(true);
    setCallAccepted(false);
    setIsCalling(false);
    setCallData(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const leaveCall = () => {
    if (connectedUser) {
      socket?.emit("end-call", { to: connectedUser });
    } else if (callData?.from) {
      socket?.emit("end-call", { to: callData.from });
    }
    endCallCleanup();
    window.location.reload(); // Simple way to reset state completely for WebRTC
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        callUser,
        answerCall,
        rejectCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        isCalling,
        callAccepted,
        callEnded,
        callData,
        isMuted,
        isVideoOff,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
