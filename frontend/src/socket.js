// src/socket.js

import { io } from "socket.io-client";

// Use Vite's environment variables to get the correct URL for development and production.
// VITE_SOCKET_URL should be set in .env files (e.g., .env.development, .env.production).
// For local testing, it will default to 'http://localhost:5000'.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Global variables for WebRTC, you should manage these in a component state
// for a real application, but for now we'll keep them as globals to match your code structure.
let peerConnection = null;
let localStream = null;
const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
const currentRoomId = 'your-room-id'; // Replace with a dynamic room ID

// Configure and create the socket connection.
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5
});

// Handle incoming WebRTC offers from other peers
socket.on("voice-offer", async ({ offer, senderId }) => {
  // Check if a peer connection already exists
  if (peerConnection) return;

  peerConnection = new RTCPeerConnection(servers);
  
  // Set up ICE candidate handling to send to other peer
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        candidate: event.candidate,
        room: currentRoomId,
        targetUserId: senderId,
      });
    }
  };

  // Get local media stream (microphone)
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  } catch (err) {
    console.error("Failed to get local media stream:", err);
    return;
  }

  // Set up event to receive the remote audio stream
  peerConnection.ontrack = (event) => {
    const remoteAudio = new Audio();
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.play();
  };

  // Set the remote description from the offer
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  // Create and send back the answer
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("voice-answer", { answer, room: currentRoomId, targetUserId: senderId });
});

// Handle incoming WebRTC answers
socket.on("voice-answer", async ({ answer }) => {
  if (peerConnection && peerConnection.remoteDescription) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

// Handle incoming ICE candidates
socket.on("ice-candidate", ({ candidate }) => {
  if (peerConnection && candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

export default socket;
