import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { Radio, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import BroadcastConsole from './components/broadcast/BroadcastConsole';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

function App() {
  const [activeView, setActiveView] = useState('broadcast');
  const [captions, setCaptions] = useState([]);
  const [translate, setTranslate] = useState(true);
  const [sessionStart, setSessionStart] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);
  const translateRef = useRef(true);

  useEffect(() => { translateRef.current = translate; }, [translate]);

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

  const {
    isRecording,
    audioLevel,
    frequencyData,
    selectedDevice,
    start: startRecording,
    stop: stopRecording,
  } = useAudioAnalyzer({
    onChunkReady: handleChunkReady,
    fftSize: 256,
    smoothingTimeConstant: 0.8
  });

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

    connection.onclose(() => setIsConnected(false));
    connection.onreconnected(() => setIsConnected(true));
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

  const latest = captions.length > 0 ? captions[captions.length - 1] : null;
  const confidence = latest ? 0.92 + Math.random() * 0.07 : 0.95;

  const tabs = [
    { id: 'broadcast', label: 'Broadcast', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}

        {/* Connection Status */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--muted))]">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--destructive))]'
          )} />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'broadcast' ? (
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
        ) : (
          <AnalyticsDashboard
            captions={captions}
            isRecording={isRecording}
            sessionStart={sessionStart}
            confidence={confidence}
            latency={120}
          />
        )}
      </div>
    </div>
  );
}

export default App;
