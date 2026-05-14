import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import BroadcastConsole from './components/broadcast/BroadcastConsole';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(true);
  const [sessionStart, setSessionStart] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);
  const translateRef = useRef(true);

  // Keep translate ref in sync for use in fetch callback
  useEffect(() => { translateRef.current = translate; }, [translate]);

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
    <BroadcastConsole
      primaryText={latest?.english || ""}
      translatedText={latest?.swahili || ""}
      captions={captions}
      isRecording={isRecording}
      onToggleRecording={handleToggleRecording}
      translateEnabled={translate}
      onToggleTranslation={handleToggleTranslate}
      audioLevel={audioLevel * 100}
      frequencyData={frequencyData}
      isConnected={isConnected}
      confidence={confidence}
      sessionStart={sessionStart}
    />
  );
}

export default App;
