// Simplified WebRTC voice chat implementation with minimal controls
let localStream;
let peerConnections = {};
let currentRoomId;
let audioContext;
let connectionCheckInterval;
let microphoneMuted = true;
let audioMuted = false;

// Global volume control (0.0 to 1.0)
let globalVolume = 1.0;

// Optimized audio constraints for voice clarity
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,      // Mono for voice clarity
    sampleRate: 44100,    // Standard sample rate for better compatibility
  }
};

// Enhanced ICE servers with multiple reliable TURN options
const servers = {
  iceServers: [
    // STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    
    // Free TURN servers (multiple options for reliability)
    {
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      username: "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw="
    },
    {
      urls: "turn:relay.metered.ca:80",
      username: "83eaddf148d958c9e33e5d0c",
      credential: "pCZxWxMjyJHGtBZ5"
    },
    {
      urls: "turn:relay.metered.ca:443",
      username: "83eaddf148d958c9e33e5d0c",
      credential: "pCZxWxMjyJHGtBZ5"
    }
  ],
  iceCandidatePoolSize: 10
};

// Offer options for better quality
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false,
  voiceActivityDetection: true
};

// Join voice chat room
export async function joinVoiceRoom(roomId) {
  try {
    console.log(`Joining voice room: ${roomId}`);
    currentRoomId = roomId;
    
    // Get audio stream (initially muted)
    localStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    console.log("Microphone access granted");
    
    // Mute the microphone initially
    localStream.getAudioTracks().forEach(track => {
      track.enabled = false;
    });
    
    // Store the stream globally for access by other components
    window.localStream = localStream;
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Start connection check
    startConnectionCheck();
    
    // Announce presence in the room
    if (window.socket) {
      window.socket.emit("voice-join", { room: roomId });
      console.log("Joined voice room:", roomId);
    } else {
      throw new Error("Socket connection not available");
    }
    
    return true;
  } catch (error) {
    console.error("Error joining voice room:", error);
    return false;
  }
}

// Leave voice chat room
export function leaveVoiceRoom() {
  // Close all peer connections
  Object.keys(peerConnections).forEach(peerId => {
    if (peerConnections[peerId]) {
      peerConnections[peerId].close();
    }
  });
  peerConnections = {};
  
  // Stop local audio stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    window.localStream = null;
  }
  
  // Remove all remote audio elements
  document.querySelectorAll('[id^="remote-audio-"]').forEach(el => {
    el.pause();
    el.srcObject = null;
    el.remove();
  });
  
  // Leave the voice room
  if (window.socket && currentRoomId) {
    window.socket.emit("voice-leave", { room: currentRoomId });
    removeSocketListeners();
    currentRoomId = null;
  }
  
  console.log("Left voice room");
}

// Toggle microphone mute state
export function toggleMicrophone() {
  if (!localStream) return false;
  
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) return false;
  
  microphoneMuted = !microphoneMuted;
  
  audioTracks.forEach(track => {
    track.enabled = !microphoneMuted;
  });
  
  console.log(`Microphone ${microphoneMuted ? 'muted' : 'unmuted'}`);
  return !microphoneMuted; // Return true if microphone is now enabled
}

// Toggle audio output mute state
export function toggleAudio() {
  audioMuted = !audioMuted;
  
  // Mute/unmute all remote audio elements
  document.querySelectorAll('[id^="remote-audio-"]').forEach(el => {
    el.muted = audioMuted;
  });
  
  console.log(`Audio ${audioMuted ? 'muted' : 'unmuted'}`);
  return !audioMuted; // Return true if audio is now enabled
}

// Get current states
export function getAudioState() {
  return {
    microphoneEnabled: !microphoneMuted,
    audioEnabled: !audioMuted
  };
}

// Set global volume for all audio
export function setGlobalVolume(volume) {
  globalVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  
  // Update all remote audio elements
  document.querySelectorAll('[id^="remote-audio-"]').forEach(el => {
    el.volume = globalVolume;
  });
  
  return globalVolume;
}

// Start periodic connection check
function startConnectionCheck() {
  // Clear any existing interval
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  // Check connections every 10 seconds
  connectionCheckInterval = setInterval(() => {
    // Check if socket is still connected
    if (!window.socket || !window.socket.connected) {
      console.warn("Socket disconnected, attempting to reconnect...");
      // The socket.io client will automatically try to reconnect
    }
    
    // Check peer connections
    Object.entries(peerConnections).forEach(([userId, pc]) => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`Connection to ${userId} is ${pc.connectionState}, attempting to reconnect...`);
        
        // Close the failed connection
        pc.close();
        
        // Create a new connection
        createPeerConnection(userId);
        
        // If we were the initiator, create a new offer
        if (window.socket && window.socket.id < userId) {
          createAndSendOffer(userId);
        }
      }
    });
  }, 10000);
}

// Set up socket event listeners for WebRTC signaling
function setupSocketListeners() {
  if (!window.socket) {
    console.error("Socket not available for voice chat");
    return;
  }
  
  // When a new user joins the room
  window.socket.on("user-joined", handleUserJoined);
  
  // When receiving an offer from another peer
  window.socket.on("voice-offer", handleVoiceOffer);
  
  // When receiving an answer to our offer
  window.socket.on("voice-answer", handleVoiceAnswer);
  
  // When receiving an ICE candidate from another peer
  window.socket.on("ice-candidate", handleIceCandidate);
  
  // When a user leaves the room
  window.socket.on("user-left", handleUserLeft);
  
  console.log("Socket event listeners set up");
}

// Remove socket event listeners
function removeSocketListeners() {
  if (!window.socket) return;
  
  window.socket.off("user-joined", handleUserJoined);
  window.socket.off("voice-offer", handleVoiceOffer);
  window.socket.off("voice-answer", handleVoiceAnswer);
  window.socket.off("ice-candidate", handleIceCandidate);
  window.socket.off("user-left", handleUserLeft);
  
  console.log("Socket event listeners removed");
}

// Handle a new user joining the room
async function handleUserJoined(data) {
  console.log("User joined voice chat:", data.userId);
  
  // Create a new peer connection for this user
  const peerConnection = createPeerConnection(data.userId);
  
  // Only the peer with the "smaller" ID creates the offer
  // This prevents both peers from creating offers simultaneously
  if (window.socket && window.socket.id < data.userId) {
    await createAndSendOffer(data.userId);
  }
}

// Create and send an offer to a peer
async function createAndSendOffer(userId) {
  const peerConnection = peerConnections[userId];
  if (!peerConnection) return;
  
  try {
    console.log(`Creating offer for ${userId}...`);
    
    // Create offer with quality options
    const offer = await peerConnection.createOffer(offerOptions);
    
    // Modify SDP to increase audio bandwidth and quality
    const modifiedSdp = offer.sdp
      .replace(/(a=fmtp:\d+ minptime=\d+)/g, '$1;useinbandfec=1')
      .replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:128\r\n');
    
    const modifiedOffer = new RTCSessionDescription({
      type: offer.type,
      sdp: modifiedSdp
    });
    
    await peerConnection.setLocalDescription(modifiedOffer);
    
    // Send the offer to the peer
    if (window.socket) {
      window.socket.emit("voice-offer", {
        targetUserId: userId,
        userId: window.socket.id,
        offer: peerConnection.localDescription,
        room: currentRoomId
      });
      
      console.log(`Sent offer to ${userId}`);
    }
  } catch (error) {
    console.error(`Error creating offer for ${userId}:`, error);
  }
}

// Handle receiving a voice offer from another peer
async function handleVoiceOffer(data) {
  console.log(`Received offer from ${data.userId}`);
  
  try {
    // Create a peer connection if it doesn't exist
    const peerConnection = createPeerConnection(data.userId);
    
    // Set the remote description (the offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    console.log(`Set remote description from ${data.userId}`);
    
    // Create an answer
    const answer = await peerConnection.createAnswer(offerOptions);
    
    // Modify SDP for better quality
    const modifiedSdp = answer.sdp
      .replace(/(a=fmtp:\d+ minptime=\d+)/g, '$1;useinbandfec=1')
      .replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:128\r\n');
    
    const modifiedAnswer = new RTCSessionDescription({
      type: answer.type,
      sdp: modifiedSdp
    });
    
    await peerConnection.setLocalDescription(modifiedAnswer);
    console.log(`Set local description (answer) for ${data.userId}`);
    
    // Send the answer back to the offerer
    if (window.socket) {
      window.socket.emit("voice-answer", {
        targetUserId: data.userId,
        userId: window.socket.id,
        answer: peerConnection.localDescription,
        room: currentRoomId
      });
      
      console.log(`Sent answer to ${data.userId}`);
    }
  } catch (error) {
    console.error(`Error handling offer from ${data.userId}:`, error);
  }
}

// Handle receiving an answer to our offer
async function handleVoiceAnswer(data) {
  console.log(`Received answer from ${data.userId}`);
  
  try {
    const peerConnection = peerConnections[data.userId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log(`Set remote description (answer) from ${data.userId}`);
    } else {
      console.warn(`No peer connection found for ${data.userId}`);
    }
  } catch (error) {
    console.error(`Error handling answer from ${data.userId}:`, error);
  }
}

// Handle receiving an ICE candidate from another peer
async function handleIceCandidate(data) {
  try {
    const peerConnection = peerConnections[data.userId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      console.log(`Added ICE candidate from ${data.userId}`);
    }
  } catch (error) {
    console.error(`Error adding ICE candidate from ${data.userId}:`, error);
  }
}

// Handle a user leaving the room
function handleUserLeft(data) {
  console.log(`User left voice chat: ${data.userId}`);
  
  // Close the peer connection
  if (peerConnections[data.userId]) {
    peerConnections[data.userId].close();
    delete peerConnections[data.userId];
  }
  
  // Remove the remote audio element
  const audioElement = document.getElementById(`remote-audio-${data.userId}`);
  if (audioElement) {
    audioElement.pause();
    audioElement.srcObject = null;
    audioElement.remove();
  }
  
  // Notify UI
  if (window.updateParticipants) {
    window.updateParticipants();
  }
}

// Create a peer connection for a specific user
function createPeerConnection(userId) {
  // If we already have a connection to this peer, close it first
  if (peerConnections[userId]) {
    peerConnections[userId].close();
  }
  
  console.log(`Creating new peer connection for ${userId}`);
  
  // Create a new peer connection with advanced configuration
  const peerConnection = new RTCPeerConnection(servers);
  peerConnections[userId] = peerConnection;
  
  // Add our local stream to the connection
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log(`Added local track to peer connection for ${userId}`);
    });
  } else {
    console.warn("No local stream available to add to peer connection");
  }
  
  // When we have a new ICE candidate, send it to the peer
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && window.socket) {
      window.socket.emit("ice-candidate", {
        targetUserId: userId,
        userId: window.socket.id,
        candidate: event.candidate,
        room: currentRoomId
      });
      console.log(`Sent ICE candidate to ${userId}`);
    }
  };
  
  // When the connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log(`Connection state with ${userId}: ${peerConnection.connectionState}`);
    
    // If connected successfully, log it
    if (peerConnection.connectionState === 'connected') {
      console.log(`Successfully connected to ${userId}`);
    }
    
    // If failed, try to restart
    if (peerConnection.connectionState === 'failed') {
      console.warn(`Connection to ${userId} failed, will try to reconnect`);
    }
  };
  
  // When the ICE connection state changes
  peerConnection.oniceconnectionstatechange = () => {
    console.log(`ICE connection state with ${userId}: ${peerConnection.iceConnectionState}`);
    
    // If ICE connection fails, try to restart ICE
    if (peerConnection.iceConnectionState === 'failed') {
      console.warn(`ICE connection with ${userId} failed, attempting restart...`);
      peerConnection.restartIce();
    }
  };
  
  // When we receive a track from the peer
  peerConnection.ontrack = (event) => {
    console.log(`Received remote track from ${userId}`);
    
    // Create an audio element for this remote stream if it doesn't exist
    let audioElement = document.getElementById(`remote-audio-${userId}`);
    if (!audioElement) {
      audioElement = new Audio();
      audioElement.id = `remote-audio-${userId}`;
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.volume = globalVolume;
      audioElement.muted = audioMuted; // Apply current audio mute state
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      console.log(`Created audio element for ${userId}`);
    }
    
    // Set the remote stream as the source for the audio element
    audioElement.srcObject = event.streams[0];
    
    // Explicitly play the audio with error handling
    audioElement.play()
      .then(() => console.log(`Playing audio from ${userId}`))
      .catch(error => {
        console.warn(`Auto-play was prevented for ${userId}:`, error);
        
        // Create a visible play button as fallback
        const playButton = document.createElement('button');
        playButton.textContent = `Play Audio`;
        playButton.style.position = 'fixed';
        playButton.style.bottom = '10px';
        playButton.style.right = '10px';
        playButton.style.zIndex = '9999';
        playButton.style.padding = '10px';
        playButton.style.backgroundColor = '#4CAF50';
        playButton.style.color = 'white';
        playButton.style.border = 'none';
        playButton.style.borderRadius = '5px';
        playButton.style.cursor = 'pointer';
        
        playButton.onclick = () => {
          audioElement.play()
            .then(() => {
              console.log(`Playing audio from ${userId} after user interaction`);
              playButton.remove();
            })
            .catch(e => console.error(`Still cannot play audio from ${userId}:`, e));
        };
        
        document.body.appendChild(playButton);
      });
    
    // Notify the VoiceChat component about the new stream
    if (window.updateRemoteStream) {
      window.updateRemoteStream(userId, event.streams[0]);
      console.log(`Notified UI about stream from ${userId}`);
    }
  };
  
  return peerConnection;
}