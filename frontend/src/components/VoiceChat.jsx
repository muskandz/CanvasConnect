import React, { useState, useEffect } from 'react';
import { joinVoiceRoom, leaveVoiceRoom, toggleMicrophone, isMicrophoneMuted, setGlobalVolume } from './voice';
import VoiceIndicator from './VoiceIndicator';

export default function VoiceChat({ roomId, onSpeakingChange }) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(1.0);
  
  // Join voice chat room automatically when component mounts
  useEffect(() => {
    handleJoin();
    
    // Clean up when component unmounts
    return () => {
      if (isJoined) {
        handleLeave();
      }
    };
  }, []);
  
  // Join voice chat room
  const handleJoin = async () => {
    try {
      setError(null);
      
      // Join the voice room (microphone starts muted)
      const success = await joinVoiceRoom(roomId);
      
      if (success) {
        setIsJoined(true);
        setIsMuted(true); // Microphone starts muted
        if (onSpeakingChange) onSpeakingChange(false);
        
        // Get the local stream for the audio indicator
        if (window.localStream) {
          setLocalStream(window.localStream);
        }
      } else {
        setError("Failed to join voice chat");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Voice chat error:", err);
    }
  };
  
  // Leave voice chat room
  const handleLeave = () => {
    leaveVoiceRoom();
    setIsJoined(false);
    setLocalStream(null);
    setParticipants([]);
    if (onSpeakingChange) onSpeakingChange(false);
  };
  
  // Toggle microphone mute/unmute
  const handleToggleMic = () => {
    const newMuteState = toggleMicrophone();
    setIsMuted(newMuteState);
    if (onSpeakingChange) onSpeakingChange(!newMuteState);
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setGlobalVolume(newVolume);
  };
  
  // Listen for participants joining/leaving
  useEffect(() => {
    if (!isJoined || !window.socket) return;
    
    const handleUserJoined = (data) => {
      setParticipants(prev => [...prev, { id: data.userId, stream: null }]);
    };
    
    const handleUserLeft = (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    };
    
    const handleRemoteStream = (data) => {
      setParticipants(prev => 
        prev.map(p => p.id === data.userId ? { ...p, stream: data.stream } : p)
      );
    };
    
    // Set up listeners
    window.socket.on('user-joined', handleUserJoined);
    window.socket.on('user-left', handleUserLeft);
    
    // Expose functions to update remote streams and participants
    window.updateRemoteStream = (userId, stream) => {
      handleRemoteStream({ userId, stream });
    };
    
    window.updateParticipants = () => {
      // This will be called when a user leaves
      if (window.socket) {
        // We don't need to do anything here as the user-left event will handle it
      }
    };
    
    return () => {
      window.socket.off('user-joined', handleUserJoined);
      window.socket.off('user-left', handleUserLeft);
      delete window.updateRemoteStream;
      delete window.updateParticipants;
    };
  }, [isJoined]);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Voice Chat</h3>
        {isJoined && (
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'} mr-2`}></span>
            <span className="text-xs">{isMuted ? 'Muted' : 'Speaking'}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      {isJoined ? (
        <div className="mb-4">
          <button 
            onClick={handleToggleMic}
            className={`${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded w-full flex items-center justify-center`}
          >
            <span className="mr-2">{isMuted ? '🔇' : '🎤'}</span>
            {isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          </button>
        </div>
      ) : (
        <div className="mb-4 text-center">
          <p className="text-gray-500">Connecting to voice chat...</p>
        </div>
      )}
      
      {isJoined && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Volume:</label>
              <span className="text-xs">{Math.round(volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Participants:</h4>
            
            {/* Local user */}
            {localStream && (
              <VoiceIndicator 
                stream={localStream} 
                userId="You" 
                isSelf={true}
                isMuted={isMuted}
              />
            )}
            
            {/* Remote participants */}
            {participants.map(participant => (
              <VoiceIndicator 
                key={participant.id}
                stream={participant.stream}
                userId={participant.id}
              />
            ))}
            
            {participants.length === 0 && (
              <p className="text-gray-500 italic text-sm">No other participants</p>
            )}
          </div>
        </>
      )}
      
      <div className="mt-4 text-center text-xs text-gray-500">
        {isJoined ? 'You can hear others. Click the button above to speak.' : 'Connecting to voice chat...'}
      </div>
    </div>
  );
}