import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import CinematicCaptionDisplay from './components/CinematicCaptionDisplay';
import TranscriptTimeline from './components/TranscriptTimeline';
import AudioRecorder from './components/AudioRecorderPcm';

function App() {
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const connectionRef = useRef(null);
  const translateRef = useRef(true);
  const recorderRef = useRef(null);

  // Keep translate ref in sync for use in fetch callback
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // Update timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    setIsRecording(prev => {
      if (!prev) {
        setSessionStart(new Date());
      }
      return !prev;
    });
  }, []);

  const handleToggleTranslate = useCallback(() => {
    setTranslate(prev => !prev);
  }, []);

  // Get the latest caption
  const latest = captions.length > 0 ? captions[captions.length - 1] : null;

  // Calculate confidence (mock for now - would come from backend)
  const confidence = latest ? 0.92 + Math.random() * 0.07 : 0.95;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 md:p-6 lg:p-8">
      {/* Hidden AudioRecorder - maintains original functionality */}
      <div className="hidden">
        <AudioRecorder 
          ref={recorderRef}
          onChunkReady={handleChunkReady} 
        />
      </div>

      {/* Main Content - Split Layout */}
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Cinematic Caption Display */}
        <div className="flex-1 flex items-center justify-center lg:min-w-0">
          <CinematicCaptionDisplay
            primaryText={latest?.english || ""}
            translatedText={latest?.swahili || ""}
            isRecording={isRecording}
            translateEnabled={translate}
            onToggleRecording={handleToggleRecording}
            onToggleTranslate={handleToggleTranslate}
            confidence={confidence}
            latency={120}
            speakerName="Speaker 1"
            timestamp={currentTime}
            className="w-full max-w-4xl"
          />
        </div>

        {/* Right Panel - Transcript Timeline */}
        <div className="lg:w-[480px] xl:w-[520px] shrink-0 h-full min-h-[400px] lg:min-h-0">
          <TranscriptTimeline 
            captions={captions}
            currentSessionId="session-1"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
