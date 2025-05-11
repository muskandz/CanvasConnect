// src/components/VoiceControls.jsx
import React, { useState, useEffect } from 'react';
import { joinVoiceRoom, leaveVoiceRoom, toggleMicrophone, toggleAudio } from './voice';

export default function VoiceControls({ roomId }) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  // Join voice chat room when component mounts
  useEffect(() => {
    const joinRoom = async () => {
      try {
        const success = await joinVoiceRoom(roomId);
        if (success) {
          setIsJoined(true);
          console.log("Successfully joined voice room");
        } else {
          console.error("Failed to join voice room");
        }
      } catch (error) {
        console.error("Error joining voice room:", error);
      }
    };
    
    joinRoom();
    
    // Clean up when component unmounts
    return () => {
      if (isJoined) {
        leaveVoiceRoom();
      }
    };
  }, [roomId]);

  // Handle microphone toggle
  const handleMicToggle = () => {
    try {
      const enabled = toggleMicrophone();
      console.log("Microphone toggled, enabled:", enabled);
      setMicEnabled(enabled);
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  // Handle audio toggle
  const handleAudioToggle = () => {
    try {
      const enabled = toggleAudio();
      console.log("Audio toggled, enabled:", enabled);
      setAudioEnabled(enabled);
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <button
        onClick={handleMicToggle}
        className={`p-3 rounded-full ${micEnabled ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg hover:opacity-90 transition-opacity`}
        title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {micEnabled ? '🎤' : '🔇'}
      </button>
      <button
        onClick={handleAudioToggle}
        className={`p-3 rounded-full ${audioEnabled ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg hover:opacity-90 transition-opacity`}
        title={audioEnabled ? 'Mute Audio' : 'Unmute Audio'}
      >
        {audioEnabled ? '🔊' : '🔈'}
      </button>
    </div>
  );
}