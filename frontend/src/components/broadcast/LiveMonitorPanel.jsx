import { useState, useEffect } from 'react';
import { 
  Monitor, 
  User, 
  Volume2, 
  Activity,
  Maximize2,
  Minimize2,
  Eye
} from 'lucide-react';
import clsx from 'clsx';

function WaveformDisplay({ frequencyData = [], isActive = false, height = 60 }) {
  const bars = 48;
  
  return (
    <div 
      className="w-full flex items-end justify-center gap-px bg-[hsl(var(--background))] rounded p-2"
      style={{ height }}
    >
      {[...Array(bars)].map((_, i) => {
        const value = frequencyData[Math.floor(i * (frequencyData.length / bars))] || 0;
        const normalizedValue = isActive ? Math.max(0.05, value / 255) : 0.05;
        
        return (
          <div
            key={i}
            className={clsx(
              "w-1 rounded-full transition-all duration-75",
              isActive 
                ? normalizedValue > 0.6 
                  ? "bg-amber-400" 
                  : normalizedValue > 0.3 
                    ? "bg-[hsl(var(--primary))]" 
                    : "bg-[hsl(var(--primary))]/50"
                : "bg-[hsl(var(--border))]"
            )}
            style={{ 
              height: `${normalizedValue * 100}%`,
              minHeight: '2px'
            }}
          />
        );
      })}
    </div>
  );
}

function ConfidenceMeter({ value = 0.95 }) {
  const percentage = value * 100;
  const color = percentage >= 90 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-red-500';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
        <div 
          className={clsx("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] w-10">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

export default function LiveMonitorPanel({
  primaryText = '',
  translatedText = '',
  isRecording = false,
  speakerName = 'Speaker 1',
  confidence = 0.95,
  translationConfidence = 0.92,
  frequencyData = [],
  audioLevel = 0,
  translateEnabled = true,
  className
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blink effect
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className={clsx(
      "h-full flex flex-col bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded overflow-hidden",
      isFullscreen && "fixed inset-4 z-40",
      className
    )}>
      {/* Monitor Header */}
      <div className="broadcast-panel-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          <span>Live Monitor</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 animate-live-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded hover:bg-[hsl(var(--border))] transition-colors"
          >
            {isFullscreen 
              ? <Minimize2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              : <Maximize2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
            }
          </button>
        </div>
      </div>

      {/* Caption Display Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Active Speaker */}
        <div className="flex items-center gap-2 mb-4">
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isRecording 
              ? "bg-[hsl(var(--primary))]/20 ring-2 ring-[hsl(var(--primary))]/50" 
              : "bg-[hsl(var(--muted))]"
          )}>
            <User className={clsx(
              "w-4 h-4",
              isRecording ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
            )} />
          </div>
          <div>
            <div className="text-sm font-medium text-[hsl(var(--foreground))]">
              {speakerName}
            </div>
            <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {isRecording ? 'Speaking' : 'Idle'}
            </div>
          </div>
        </div>

        {/* Primary Caption - English */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 rounded">
                EN
              </span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Primary</span>
              <div className="flex-1" />
              <ConfidenceMeter value={confidence} />
            </div>
            <div className={clsx(
              "p-4 rounded bg-[hsl(var(--background))] border",
              isRecording ? "border-[hsl(var(--primary))]/30" : "border-[hsl(var(--border))]"
            )}>
              <p className={clsx(
                "text-xl font-medium leading-relaxed",
                primaryText ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))] italic"
              )}>
                {primaryText || 'Waiting for speech...'}
                {isRecording && showCursor && (
                  <span className="inline-block w-0.5 h-5 bg-[hsl(var(--primary))] ml-1 align-middle" />
                )}
              </p>
            </div>
          </div>

          {/* Translated Caption - Kiswahili */}
          {translateEnabled && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  SW
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Translation</span>
                <div className="flex-1" />
                <ConfidenceMeter value={translationConfidence} />
              </div>
              <div className={clsx(
                "p-4 rounded bg-[hsl(var(--background))] border",
                translatedText ? "border-amber-500/30" : "border-[hsl(var(--border))]"
              )}>
                <p className={clsx(
                  "text-lg leading-relaxed",
                  translatedText ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))] italic"
                )}>
                  {translatedText || 'Inasubiri tafsiri...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waveform Monitor */}
      <div className="p-3 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            Audio Waveform
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
              {audioLevel.toFixed(0)}%
            </span>
          </div>
        </div>
        <WaveformDisplay 
          frequencyData={frequencyData} 
          isActive={isRecording} 
          height={48}
        />
      </div>
    </div>
  );
}
