import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Languages,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Radio,
  Zap,
  Volume2,
  User,
  Settings,
  Eye,
  Type
} from 'lucide-react';
import clsx from 'clsx';

// Audio Waveform Visualization Component
function AudioWaveform({ isActive, audioLevel = 0 }) {
  const bars = 24;
  
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {[...Array(bars)].map((_, i) => {
        const centerDistance = Math.abs(i - bars / 2) / (bars / 2);
        const baseHeight = isActive ? 0.3 + (1 - centerDistance) * 0.5 : 0.15;
        const dynamicHeight = isActive 
          ? baseHeight + (audioLevel * (1 - centerDistance * 0.5) * Math.random() * 0.5)
          : baseHeight;
        
        return (
          <div
            key={i}
            className={clsx(
              "w-[3px] rounded-full transition-all duration-75",
              isActive 
                ? "bg-gradient-to-t from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)]"
                : "bg-[hsl(var(--muted-foreground)/0.3)]"
            )}
            style={{
              height: `${dynamicHeight * 100}%`,
              animationDelay: `${i * 50}ms`
            }}
          />
        );
      })}
    </div>
  );
}

// Live Status Indicator
function LiveIndicator({ isLive }) {
  return (
    <div className={clsx(
      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold tracking-wide",
      isLive
        ? "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.3)]"
        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]"
    )}>
      <div className={clsx(
        "w-2.5 h-2.5 rounded-full",
        isLive ? "bg-[hsl(var(--destructive))] animate-pulse" : "bg-[hsl(var(--muted-foreground))]"
      )} />
      {isLive ? 'LIVE' : 'STANDBY'}
    </div>
  );
}

// Status Chip Component
function StatusChip({ icon: Icon, label, value, variant = 'default', pulse = false }) {
  const variants = {
    default: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]",
    success: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]",
    primary: "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.25)]",
    warning: "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]"
  };

  return (
    <div className={clsx(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
      variants[variant]
    )}>
      <Icon className={clsx("w-3.5 h-3.5", pulse && "animate-pulse")} />
      {label && <span className="opacity-70">{label}</span>}
      {value && <span className="font-semibold">{value}</span>}
    </div>
  );
}

// Control Button Component
function ControlButton({ icon: Icon, label, active, onClick, variant = 'default', size = 'md' }) {
  const variants = {
    default: active 
      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/0.3)]"
      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]",
    danger: active
      ? "bg-[hsl(var(--destructive))] text-white shadow-lg shadow-[hsl(var(--destructive)/0.3)]"
      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.2)] hover:text-[hsl(var(--destructive))]",
    ghost: "bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
  };

  const sizes = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4"
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-xl transition-all duration-200 flex items-center justify-center",
        variants[variant],
        sizes[size]
      )}
      title={label}
      aria-label={label}
    >
      <Icon className={clsx(size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
    </button>
  );
}

// Main Component
export default function CinematicCaptionDisplay({
  primaryText = "",
  translatedText = "",
  isRecording = false,
  translateEnabled = true,
  onToggleRecording,
  onToggleTranslate,
  confidence = 0.95,
  latency = 120,
  speakerName = "Speaker 1",
  timestamp = "",
  className
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [fontSize, setFontSize] = useState('large');
  const containerRef = useRef(null);

  // Simulate audio level changes when recording
  useEffect(() => {
    if (!isRecording) {
      setAudioLevel(0);
      return;
    }
    
    const interval = setInterval(() => {
      setAudioLevel(0.3 + Math.random() * 0.7);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleCopy = () => {
    const text = translateEnabled && translatedText 
      ? `${primaryText}\n\n${translatedText}`
      : primaryText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fontSizes = {
    medium: { primary: 'text-2xl md:text-3xl', translated: 'text-xl md:text-2xl' },
    large: { primary: 'text-3xl md:text-4xl lg:text-5xl', translated: 'text-2xl md:text-3xl' },
    xlarge: { primary: 'text-4xl md:text-5xl lg:text-6xl', translated: 'text-3xl md:text-4xl' }
  };

  const hasContent = primaryText || translatedText;

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative w-full min-h-[600px] rounded-3xl overflow-hidden",
        "bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--background))] to-[hsl(var(--card)/0.8)]",
        "border border-[hsl(var(--border)/0.5)]",
        "shadow-2xl shadow-black/20",
        isFullscreen && "fixed inset-0 z-50 rounded-none min-h-screen",
        className
      )}
    >
      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={clsx(
          "absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000",
          "bg-[hsl(var(--primary)/0.15)]",
          isRecording ? "opacity-100" : "opacity-30"
        )} />
        <div className={clsx(
          "absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000",
          "bg-[hsl(var(--accent)/0.1)]",
          translateEnabled ? "opacity-100" : "opacity-30"
        )} />
      </div>

      {/* Top Status Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border)/0.3)]">
        <div className="flex items-center gap-3 flex-wrap">
          <LiveIndicator isLive={isRecording} />
          
          <StatusChip
            icon={Mic}
            label="Mic"
            value={isRecording ? "Active" : "Off"}
            variant={isRecording ? "success" : "default"}
            pulse={isRecording}
          />
          
          {translateEnabled && (
            <StatusChip
              icon={Languages}
              label=""
              value="EN → SW"
              variant="primary"
            />
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StatusChip
            icon={Zap}
            label="Confidence"
            value={`${Math.round(confidence * 100)}%`}
            variant={confidence > 0.9 ? "success" : confidence > 0.7 ? "warning" : "default"}
          />
          
          <StatusChip
            icon={Radio}
            label="Latency"
            value={`${latency}ms`}
            variant={latency < 150 ? "success" : latency < 300 ? "warning" : "default"}
          />

          {timestamp && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono px-3 py-1.5 bg-[hsl(var(--muted)/0.5)] rounded-full">
              {timestamp}
            </span>
          )}
        </div>
      </div>

      {/* Speaker & Audio Visualization */}
      <div className="relative z-10 flex items-center justify-center gap-6 py-4 border-b border-[hsl(var(--border)/0.2)]">
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <User className="w-4 h-4" />
          <span>{speakerName}</span>
        </div>
        
        <div className="w-64">
          <AudioWaveform isActive={isRecording} audioLevel={audioLevel} />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Volume2 className={clsx("w-4 h-4", isRecording && "text-[hsl(var(--success))]")} />
          <span>{isRecording ? "Listening..." : "Waiting"}</span>
        </div>
      </div>

      {/* Main Caption Area */}
      <div className={clsx(
        "relative z-10 flex flex-col items-center justify-center px-8 md:px-12 lg:px-16",
        isFullscreen ? "min-h-[calc(100vh-200px)]" : "min-h-[320px]",
        "py-12"
      )}>
        {hasContent ? (
          <div className="w-full max-w-5xl space-y-8 text-center">
            {/* Primary English Caption */}
            <div className="space-y-2">
              <p className={clsx(
                "font-bold text-[hsl(var(--foreground))] leading-tight tracking-tight",
                "transition-all duration-300",
                fontSizes[fontSize].primary
              )}>
                {primaryText}
              </p>
              {isRecording && (
                <span className="inline-block w-0.5 h-8 bg-[hsl(var(--primary))] animate-pulse ml-1" />
              )}
            </div>

            {/* Kiswahili Translation */}
            {translateEnabled && translatedText && (
              <div className="pt-4 border-t border-[hsl(var(--border)/0.3)]">
                <p className={clsx(
                  "font-medium text-[hsl(var(--primary))] leading-relaxed",
                  "transition-all duration-300 italic",
                  fontSizes[fontSize].translated
                )}>
                  {translatedText}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto">
              <Mic className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              {isRecording ? "Listening for speech..." : "Start recording to see live captions"}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground)/0.7)]">
              Your words will appear here in real-time
            </p>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Accessibility Panel */}
        {showAccessibility && (
          <div className="mx-6 mb-2 p-4 rounded-2xl bg-[hsl(var(--card)/0.95)] backdrop-blur-xl border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Caption Size</span>
              <div className="flex items-center gap-2">
                {['medium', 'large', 'xlarge'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      fontSize === size
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    )}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 px-6 py-5 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background)/0.95)] to-transparent">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-[hsl(var(--card)/0.8)] backdrop-blur-xl border border-[hsl(var(--border))]">
            {/* Microphone Toggle */}
            <ControlButton
              icon={isRecording ? Mic : MicOff}
              label={isRecording ? "Stop Recording" : "Start Recording"}
              active={isRecording}
              onClick={onToggleRecording}
              variant="danger"
              size="lg"
            />

            {/* Translation Toggle */}
            <ControlButton
              icon={Languages}
              label={translateEnabled ? "Disable Translation" : "Enable Translation"}
              active={translateEnabled}
              onClick={onToggleTranslate}
              size="md"
            />

            <div className="w-px h-8 bg-[hsl(var(--border))]" />

            {/* Copy */}
            <ControlButton
              icon={copied ? Check : Copy}
              label="Copy Transcript"
              active={copied}
              onClick={handleCopy}
              variant="ghost"
              size="md"
            />

            {/* Accessibility */}
            <ControlButton
              icon={Type}
              label="Accessibility Options"
              active={showAccessibility}
              onClick={() => setShowAccessibility(!showAccessibility)}
              variant="ghost"
              size="md"
            />

            {/* Fullscreen */}
            <ControlButton
              icon={isFullscreen ? Minimize2 : Maximize2}
              label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              active={isFullscreen}
              onClick={toggleFullscreen}
              variant="ghost"
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
