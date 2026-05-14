import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import CinematicCaptionDisplay from './components/CinematicCaptionDisplay';
import TranscriptTimeline from './components/TranscriptTimeline';
import AudioMonitorPanel from './components/AudioMonitorPanel';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(true);
  const [sessionStart, setSessionStart] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.5);
  const connectionRef = useRef(null);
  const translateRef = useRef(true);

  // Keep translate ref in sync for use in fetch callback
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // Update timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send each audio chunk to the .NET backend
  const handleChunkReady = useCallback(async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `chunk_${Date.now()}.wav`);
    const url = `http://localhost:5260/api/audio/upload?translate=${translateRef.current}`;
    try {
      await fetch(url, { method: 'POST', body: formData });
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, []);

  // Initialize enhanced audio analyzer
  const {
    isRecording,
    audioLevel,
    isSpeaking,
    frequencyData,
    waveformData,
    noiseFloor,
    peakLevel,
    devices,
    selectedDevice,
    start: startRecording,
    stop: stopRecording,
    setSelectedDevice
  } = useAudioAnalyzer({
    onChunkReady: handleChunkReady,
    fftSize: 256,
    smoothingTimeConstant: 0.8
  });

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

    connection.onclose(() => {
      console.log("SignalR disconnected");
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
    });

    connection.start()
      .then(() => setIsConnected(true))
      .catch(err => console.error("SignalR error:", err));

    return () => connection.stop();
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(selectedDevice);
      setSessionStart(new Date());
    }
  }, [isRecording, startRecording, stopRecording, selectedDevice]);

  const handleToggleTranslate = useCallback(() => {
    setTranslate(prev => !prev);
  }, []);

  // Get the latest caption
  const latest = captions.length > 0 ? captions[captions.length - 1] : null;

  // Calculate confidence (mock for now - would come from backend)
  const confidence = latest ? 0.92 + Math.random() * 0.07 : 0.95;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 md:p-6 lg:p-8">
      {/* Main Content - Three Column Layout */}
      <div className="max-w-[2000px] mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex flex-col xl:flex-row gap-6">
        
        {/* Left Panel - Audio Monitor */}
        <div className="xl:w-[380px] shrink-0 order-2 xl:order-1">
          <AudioMonitorPanel
            isRecording={isRecording}
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
            frequencyData={frequencyData}
            waveformData={waveformData}
            noiseFloor={noiseFloor}
            peakLevel={peakLevel}
            devices={devices}
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
            onToggleRecording={handleToggleRecording}
            isConnected={isConnected}
            streamHealth={isConnected ? 'good' : 'poor'}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
            noiseSuppression={true}
            className="h-full"
          />
        </div>

        {/* Center Panel - Cinematic Caption Display */}
        <div className="flex-1 flex items-center justify-center min-w-0 order-1 xl:order-2">
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
        <div className="xl:w-[420px] shrink-0 h-full min-h-[400px] xl:min-h-0 order-3">
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
