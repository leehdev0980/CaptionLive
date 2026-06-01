import { useState } from 'react';
import { 
  Radio, 
  Circle, 
  Activity, 
  Wifi, 
  Clock, 
  AlertTriangle,
  User,
  Settings,
  Power,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

export default function BroadcastControlBar({
  isLive = false,
  isRecording = false,
  streamHealth = 'good',
  bitrate = 2500,
  latency = 120,
  operatorName = 'Operator',
  onEmergencyStop,
  onEmergencyMute,
  isMuted = false,
  className
}) {
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const healthColors = {
    good: 'text-emerald-400',
    fair: 'text-amber-400',
    poor: 'text-red-400'
  };

  const healthBg = {
    good: 'bg-emerald-500/20',
    fair: 'bg-amber-500/20',
    poor: 'bg-red-500/20'
  };

  return (
    <div className={clsx(
      "h-12 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]",
      "flex items-center justify-between px-3 gap-4",
      className
    )}>
      {/* Left Section - Live Status & Recording */}
      <div className="flex items-center gap-3">
        {/* LIVE Indicator */}
        <div className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider",
          isLive 
            ? "bg-red-600 text-white animate-live-pulse" 
            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        )}>
          <Radio className="w-3 h-3" />
          <span>LIVE</span>
        </div>

        {/* Recording State */}
        <div className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
          isRecording 
            ? "bg-red-500/20 text-red-400" 
            : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
        )}>
          <Circle className={clsx("w-2.5 h-2.5", isRecording && "fill-red-500 text-red-500")} />
          <span>{isRecording ? 'REC' : 'STANDBY'}</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[hsl(var(--border))]" />

        {/* Stream Health */}
        <div className={clsx(
          "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
          healthBg[streamHealth]
        )}>
          <Activity className={clsx("w-3.5 h-3.5", healthColors[streamHealth])} />
          <span className={healthColors[streamHealth]}>
            {streamHealth.toUpperCase()}
          </span>
        </div>

        {/* Bitrate */}
        <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          <Zap className="w-3.5 h-3.5" />
          <span className="font-mono">{bitrate} kbps</span>
        </div>

        {/* Latency */}
        <div className={clsx(
          "flex items-center gap-1.5 text-xs",
          latency < 150 
            ? "text-emerald-400" 
            : latency < 300 
              ? "text-amber-400" 
              : "text-red-400"
        )}>
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{latency}ms</span>
        </div>
      </div>

      {/* Center - Logo/Title */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
          CaptionLive
        </span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          Broadcast Control
        </span>
      </div>

      {/* Right Section - Operator & Emergency */}
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[hsl(var(--border))]" />

        {/* Emergency Mute */}
        <button
          onClick={onEmergencyMute}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
            isMuted 
              ? "bg-red-500/30 text-red-400 border border-red-500/50" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))]"
          )}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
        </button>

        {/* Emergency Stop */}
        <button
          onClick={() => setShowEmergencyConfirm(true)}
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase",
            "bg-red-600/20 text-red-400 border border-red-600/50",
            "hover:bg-red-600/30 transition-colors",
            showEmergencyConfirm && "emergency-glow"
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>STOP</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[hsl(var(--border))]" />

        {/* Operator Profile */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[hsl(var(--primary))] flex items-center justify-center">
            <User className="w-4 h-4 text-[hsl(var(--primary-foreground))]" />
          </div>
          <span className="text-xs text-[hsl(var(--foreground))] font-medium">
            {operatorName}
          </span>
        </div>

        {/* Settings */}
        <button className="p-1.5 rounded hover:bg-[hsl(var(--muted))] transition-colors">
          <Settings className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Emergency Confirm Modal */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[hsl(var(--card))] border border-red-600/50 rounded-lg p-6 max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-600/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Emergency Stop
              </h3>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
              This will immediately stop all broadcasting, recording, and translation services.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="flex-1 px-4 py-2 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium hover:bg-[hsl(var(--border))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmergencyStop?.();
                  setShowEmergencyConfirm(false);
                }}
                className="flex-1 px-4 py-2 rounded bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Confirm Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
