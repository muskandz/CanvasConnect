import React, { useState, useEffect, useRef } from 'react';

export default function VoiceIndicator({ stream, userId, isSelf = false, isMuted = false }) {
  const [volume, setVolume] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const speakingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!stream) return;
    
    // Create audio context and analyzer
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    
    // Connect the stream to the analyzer
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Start analyzing audio levels
    const updateVolume = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / dataArrayRef.current.length;
      
      // Scale to 0-100
      const scaledVolume = Math.min(100, Math.max(0, avg * 2));
      setVolume(scaledVolume);
      
      // Detect speaking
      if (scaledVolume > 15) {
        setSpeaking(true);
        
        // Reset speaking timeout
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }
        
        // Set timeout to stop "speaking" indicator after 500ms of silence
        speakingTimeoutRef.current = setTimeout(() => {
          setSpeaking(false);
        }, 500);
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);
  
  // Determine color based on volume level
  const getColor = () => {
    if (isMuted) return '#cccccc'; // Gray when muted
    if (volume < 10) return '#4CAF50'; // Green when quiet
    if (volume < 30) return '#8BC34A'; // Light green for low
    if (volume < 50) return '#CDDC39'; // Lime for moderate
    if (volume < 70) return '#FFC107'; // Amber for louder
    if (volume < 90) return '#FF9800'; // Orange for very loud
    return '#F44336'; // Red for extremely loud
  };
  
  // Get avatar initials
  const getInitials = () => {
    if (isSelf) return 'Me';
    if (typeof userId === 'string') {
      return userId.substring(0, 2).toUpperCase();
    }
    return '?';
  };
  
  return (
    <div className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${speaking && !isMuted ? 'bg-blue-50 shadow-sm' : 'bg-gray-50'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${isMuted ? 'bg-gray-400' : speaking ? 'bg-blue-600 scale-110' : 'bg-blue-400'}`}>
        {getInitials()}
      </div>
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-100 ease-out"
            style={{ 
              width: `${isMuted ? 0 : volume}%`, 
              backgroundColor: getColor() 
            }}
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 min-w-[60px] text-right flex items-center">
        {isSelf ? 'You' : `User ${userId.substring(0, 4)}`}
        {isMuted && <span className="ml-1 text-red-500">🔇</span>}
        {speaking && !isMuted && <span className="ml-1 text-green-500">🎤</span>}
      </div>
    </div>
  );
}