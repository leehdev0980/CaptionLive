import { useState, useRef, useCallback } from 'react';

export default function AudioRecorder({ onChunkReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = recorder;
      let chunkId = 0;

      recorder.ondataavailable = (event) => {
        // Prevent empty blobs (size > 1000 bytes)
        if (event.data.size > 1000) {
          chunkId++;
          setChunkCount(chunkId);
          console.log(`Chunk ${chunkId} captured, size: ${event.data.size} bytes`);
          
          // Send chunk to parent/pipeline
          onChunkReady(event.data, chunkId);
        }
      };

      // Capture every 2 seconds
      recorder.start(2000);
      setIsRecording(true);
      
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access denied. Please allow microphone access and try again.");
    }
  }, [onChunkReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setChunkCount(0);
  }, []);

  return (
    <div style={{ marginBottom: '20px' }}>
      <button 
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isRecording ? '#e74c3c' : '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
      </button>
      {isRecording && (
        <span style={{ marginLeft: '15px', color: '#666' }}>
          Recording... Chunks sent: {chunkCount}
        </span>
      )}
    </div>
  );
}