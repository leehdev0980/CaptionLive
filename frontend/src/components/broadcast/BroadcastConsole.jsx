import { useState, useEffect, useMemo } from 'react';
import BroadcastControlBar from './BroadcastControlBar';
import LanguageRoutingPanel from './LanguageRoutingPanel';
import LiveMonitorPanel from './LiveMonitorPanel';
import ModerationPanel from './ModerationPanel';
import OperationalTimeline from './OperationalTimeline';

export default function BroadcastConsole({
  // Caption Data
  primaryText = '',
  translatedText = '',
  captions = [],
  
  // Recording State
  isRecording = false,
  onToggleRecording,
  
  // Translation State
  translateEnabled = true,
  onToggleTranslation,
  
  // Audio Data
  audioLevel = 0,
  frequencyData = [],
  
  // Connection State
  isConnected = false,
  
  // Confidence
  confidence = 0.95,
  
  // Session
  sessionStart = null
}) {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(true);

  // Calculate stream health based on connection and audio
  const streamHealth = useMemo(() => {
    if (!isConnected) return 'poor';
    if (audioLevel > 80) return 'fair';
    return 'good';
  }, [isConnected, audioLevel]);

  // Calculate bitrate (mock)
  const bitrate = useMemo(() => {
    return isRecording ? 2400 + Math.floor(Math.random() * 200) : 0;
  }, [isRecording]);

  // Calculate latency (mock)
  const latency = useMemo(() => {
    return isConnected ? 100 + Math.floor(Math.random() * 50) : 999;
  }, [isConnected]);

  // Update session duration
  useEffect(() => {
    if (!sessionStart || !isRecording) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
      setSessionDuration(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStart, isRecording]);

  // Generate timeline events from captions
  useEffect(() => {
    const events = captions.map((caption, idx) => ({
      id: idx,
      type: 'caption',
      text: caption.english?.substring(0, 50) || 'Caption',
      timestamp: idx * 5 // Mock timestamp
    }));

    // Add some translation events
    const translationEvents = captions
      .filter(c => c.swahili)
      .map((caption, idx) => ({
        id: `trans-${idx}`,
        type: 'translation',
        text: caption.swahili?.substring(0, 50) || 'Translation',
        timestamp: idx * 5 + 1
      }));

    // Add some mock audio spikes
    const audioEvents = [...Array(Math.floor(sessionDuration / 30))].map((_, idx) => ({
      id: `audio-${idx}`,
      type: 'audio_spike',
      text: 'Audio level spike detected',
      timestamp: idx * 30 + 15
    }));

    setTimelineEvents([...events, ...translationEvents, ...audioEvents]);
  }, [captions, sessionDuration]);

  // Set live status when recording starts
  useEffect(() => {
    setIsLive(isRecording);
  }, [isRecording]);

  const handleEmergencyStop = () => {
    setIsLive(false);
    onToggleRecording?.();
  };

  const handleEmergencyMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleTimelineSeek = (time) => {
    // In a real app, this would seek to the specific time
    console.log('Seeking to:', time);
  };

  const handleCorrectionSubmit = (text) => {
    // In a real app, this would submit the correction
    console.log('Correction submitted:', text);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[hsl(var(--background))] overflow-hidden">
      {/* Top Control Bar */}
      <BroadcastControlBar
        isLive={isLive}
        isRecording={isRecording}
        streamHealth={streamHealth}
        bitrate={bitrate}
        latency={latency}
        operatorName="Operator"
        onEmergencyStop={handleEmergencyStop}
        onEmergencyMute={handleEmergencyMute}
        isMuted={isMuted}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Language Routing */}
        <div className="w-64 shrink-0 border-r border-[hsl(var(--border))]">
          <LanguageRoutingPanel
            sourceLanguage={{ code: 'en', name: 'English', flag: 'EN' }}
            targetLanguages={[{ code: 'sw', name: 'Kiswahili', flag: 'SW' }]}
            activeLanguages={['en', 'sw']}
            translateEnabled={translateEnabled}
            onToggleTranslation={onToggleTranslation}
            englishText={primaryText}
            swahiliText={translatedText}
            audioLevel={audioLevel}
          />
        </div>

        {/* Center Panel - Live Monitor */}
        <div className="flex-1 min-w-0 p-3">
          <LiveMonitorPanel
            primaryText={primaryText}
            translatedText={translatedText}
            isRecording={isRecording}
            speakerName="Speaker 1"
            confidence={confidence}
            translationConfidence={0.92 + Math.random() * 0.06}
            frequencyData={frequencyData}
            audioLevel={audioLevel}
            translateEnabled={translateEnabled}
          />
        </div>

        {/* Right Panel - Moderation */}
        <div className="w-72 shrink-0 border-l border-[hsl(var(--border))]">
          <ModerationPanel
            isRecording={isRecording}
            isMuted={isMuted}
            onMute={handleEmergencyMute}
            onCorrectionSubmit={handleCorrectionSubmit}
          />
        </div>
      </div>

      {/* Bottom Timeline */}
      <OperationalTimeline
        events={timelineEvents}
        duration={Math.max(300, sessionDuration + 60)}
        currentTime={sessionDuration}
        isPlaying={isTimelinePlaying}
        onSeek={handleTimelineSeek}
        onTogglePlay={() => setIsTimelinePlaying(prev => !prev)}
      />
    </div>
  );
}
