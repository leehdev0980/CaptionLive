import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import DashboardLayout from './components/layout/DashboardLayout';
import LiveSessionView from './components/workspace/LiveSessionView';
import AudioRecorder from './components/AudioRecorderPcm';

function App() {
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const connectionRef = useRef(null);
  const translateRef = useRef(false);
  const recorderRef = useRef(null);

  // Keep translate ref in sync for use in fetch callback
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // Set up SignalR connection for receiving captions
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5260/captionHub")
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.on('ReceiveCaption', (english, swahili) => {
      setCaptions(prev => [...prev, {
        english,
        swahili: swahili || "",
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    connection.onclose(() => console.log("SignalR disconnected"));
    connection.start().catch(err => console.error("SignalR error:", err));

    return () => connection.stop();
  }, []);

  // Send each audio chunk from AudioRecorder to the .NET backend
  const handleChunkReady = useCallback(async (audioBlob, chunkId) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `chunk_${chunkId}.wav`);
    const url = `http://localhost:5260/api/audio/upload?translate=${translateRef.current}`;
    try {
      await fetch(url, { method: 'POST', body: formData });
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, []);

  const handleToggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    // The AudioRecorder component handles the actual recording logic
    // This state is for UI feedback
  }, []);

  const handleToggleTranslate = useCallback(() => {
    setTranslate(prev => !prev);
  }, []);

  return (
    <DashboardLayout>
      {/* Hidden AudioRecorder - maintains original functionality */}
      <div className="hidden">
        <AudioRecorder 
          ref={recorderRef}
          onChunkReady={handleChunkReady} 
        />
      </div>

      {/* Live Session View */}
      <LiveSessionView
        captions={captions}
        isRecording={isRecording}
        translateEnabled={translate}
        onToggleRecording={handleToggleRecording}
        onToggleTranslate={handleToggleTranslate}
        isLive={true}
      />
    </DashboardLayout>
  );
}

export default App;
