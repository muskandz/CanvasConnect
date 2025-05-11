import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("voice-offer", async ({ offer }) => {
  peerConnection = new RTCPeerConnection(servers);
  peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("voice-candidate", {
      candidate: event.candidate,
      room: currentRoomId,
    });
  }
};
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    const remoteAudio = new Audio();
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.play();
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("voice-answer", { answer, room: currentRoomId });
});

socket.on("voice-answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("voice-candidate", ({ candidate }) => {
  if (candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});


export default socket;
