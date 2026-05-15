import { useState, useMemo, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Activity,
  Volume2,
  VolumeX,
  Radio,
  Waves,
  Settings2,
  ChevronDown,
  Check,
  Wifi,
  WifiOff,
  Shield,
  Gauge,
  AudioWaveform,
  Circle
} from 'lucide-react';
import clsx from 'clsx';

/**
 * Premium Audio Monitoring Panel
 * Real-time audio visualization optimized for speech transcription
 */
export default function AudioMonitorPanel({
  // Audio state from useAudioAnalyzer
  isRecording = false,
  audioLevel = 0,
  isSpeaking = false,
  frequencyData = new Uint8Array(128),
  waveformData = new Uint8Array(256),
  noiseFloor = 0,
  peakLevel = 0,
  // Device management
  devices = [],
  selectedDevice = null,
  onDeviceChange,
  // Controls
  onToggleRecording,
  isMuted = false,
  onToggleMute,
  // Connection status
  isConnected = true,
  streamHealth = 'good', // 'good' | 'fair' | 'poor'
  // Settings
  sensitivity = 0.5,
  onSensitivityChange,
  noiseSuppression = true,
  onNoiseSuppressionChange,
  // Styling
  className = ''
}) {
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get device display name
  const activeDeviceName = useMemo(() => {
    if (!selectedDevice || devices.length === 0) return 'No microphone';
    const device = devices.find(d => d.deviceId === selectedDevice);
    return device?.label || 'Microphone';
  }, [selectedDevice, devices]);

  // Truncate device name for display
  const truncatedDeviceName = useMemo(() => {
    if (activeDeviceName.length > 28) {
      return activeDeviceName.slice(0, 25) + '...';
    }
    return activeDeviceName;
  }, [activeDeviceName]);

  // Calculate waveform bars from frequency data
  const waveformBars = useMemo(() => {
    const barCount = 32;
    const bars = [];
    const binSize = Math.floor(frequencyData.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += frequencyData[i * binSize + j] || 0;
      }
      // Normalize to 0-1 and apply speech-optimized curve
      const avg = sum / binSize / 255;
      const height = Math.pow(avg, 0.7) * (sensitivity + 0.5);
      bars.push(Math.min(1, height));
    }
    return bars;
  }, [frequencyData, sensitivity]);

  // Time domain waveform for oscilloscope view
  const oscilloscopePoints = useMemo(() => {
    const points = [];
    const step = Math.max(1, Math.floor(waveformData.length / 100));
    for (let i = 0; i < waveformData.length; i += step) {
      const value = (waveformData[i] - 128) / 128;
      points.push(value);
    }
    return points;
  }, [waveformData]);

  // Status indicator color
  const getStatusColor = useCallback((level) => {
    if (level > 0.85) return 'text-red-400';
    if (level > 0.6) return 'text-amber-400';
    return 'text-emerald-400';
  }, []);

  const healthColors = {
    good: 'bg-emerald-500',
    fair: 'bg-amber-500',
    poor: 'bg-red-500'
  };

  return (
    <div className={clsx(
      'rounded-2xl border border-[hsl(var(--border))]',
      'bg-[hsl(var(--card))] overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isRecording 
              ? 'bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))]' 
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
          )}>
            <AudioWaveform className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Audio Monitor</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {isRecording ? 'Listening for speech' : 'Microphone inactive'}
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isConnected 
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          )}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Main Waveform Visualization */}
      <div className="px-5 py-6">
        <div className={clsx(
          'relative h-32 rounded-xl overflow-hidden',
          'bg-[hsl(var(--background))] border border-[hsl(var(--border))]'
        )}>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 right-0 h-px bg-[hsl(var(--border))]" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[hsl(var(--border))]" />
            <div className="absolute top-3/4 left-0 right-0 h-px bg-[hsl(var(--border))]" />
          </div>

          {/* Frequency Bars */}
          <div className="absolute inset-0 flex items-end justify-center gap-[2px] px-3 pb-2">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className={clsx(
                  'flex-1 rounded-t transition-all duration-75',
                  isSpeaking 
                    ? 'bg-gradient-to-t from-[hsl(var(--primary))] to-[hsl(var(--primary))/0.6]' 
                    : 'bg-gradient-to-t from-[hsl(var(--muted-foreground))/0.4] to-[hsl(var(--muted-foreground))/0.2]'
                )}
                style={{ 
                  height: `${Math.max(4, height * 100)}%`,
                  opacity: isRecording ? 1 : 0.3
                }}
              />
            ))}
          </div>

          {/* Speaking indicator pulse */}
          {isSpeaking && isRecording && (
            <div className="absolute inset-0 bg-[hsl(var(--primary))/0.05] animate-pulse" />
          )}

          {/* Inactive overlay */}
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--background))/0.5]">
              <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                <MicOff className="w-5 h-5" />
                <span className="text-sm font-medium">Microphone Off</span>
              </div>
            </div>
          )}

          {/* Live badge */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 text-red-400">
              <Circle className="w-2 h-2 fill-current animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Meters */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-4">
        {/* Input Level Meter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Input Level</span>
            <span className={clsx('text-xs font-mono', getStatusColor(audioLevel))}>
              {Math.round(audioLevel * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div 
              className={clsx(
                'h-full rounded-full transition-all duration-75',
                audioLevel > 0.85 ? 'bg-red-500' :
                audioLevel > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          {/* Peak indicator */}
          <div className="relative h-1">
            <div 
              className="absolute top-0 w-1 h-1 rounded-full bg-white/50"
              style={{ left: `${Math.min(100, peakLevel * 100)}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        {/* Noise Floor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Noise Floor</span>
            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
              {Math.round(noiseFloor * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div 
              className="h-full rounded-full bg-[hsl(var(--primary))/0.5] transition-all duration-300"
              style={{ width: `${noiseFloor * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voice Detection Indicator */}
      <div className="px-5 pb-4">
        <div className={clsx(
          'flex items-center justify-between p-3 rounded-xl transition-all duration-200',
          isSpeaking && isRecording
            ? 'bg-[hsl(var(--primary))/0.1] border border-[hsl(var(--primary))/0.3]'
            : 'bg-[hsl(var(--muted))/0.5] border border-transparent'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isSpeaking && isRecording
                ? 'bg-[hsl(var(--primary))/0.2] text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            )}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">Voice Activity</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {isSpeaking && isRecording ? 'Speech detected' : 'Waiting for speech...'}
              </p>
            </div>
          </div>
          
          {/* Pulse animation when speaking */}
          {isSpeaking && isRecording && (
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary))]" />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-[hsl(var(--primary))] animate-ping" />
            </div>
          )}
        </div>
      </div>

      {/* Microphone Selector */}
      <div className="px-5 pb-4">
        <div className="relative">
          <button
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            disabled={isRecording}
            className={clsx(
              'w-full flex items-center justify-between p-3 rounded-xl transition-all',
              'border border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]',
              'hover:bg-[hsl(var(--muted))/0.5]',
              isRecording && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isRecording 
                  ? 'bg-[hsl(var(--primary))/0.2] text-[hsl(var(--primary))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              )}>
                <Mic className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Input Device</p>
                <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate max-w-[200px]">
                  {truncatedDeviceName}
                </p>
              </div>
            </div>
            <ChevronDown className={clsx(
              'w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform',
              showDeviceMenu && 'rotate-180'
            )} />
          </button>

          {/* Device dropdown */}
          {showDeviceMenu && !isRecording && (
            <div className={clsx(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]',
              'shadow-xl overflow-hidden'
            )}>
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    onDeviceChange?.(device.deviceId);
                    setShowDeviceMenu(false);
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 text-left',
                    'hover:bg-[hsl(var(--muted))/0.5] transition-colors',
                    selectedDevice === device.deviceId && 'bg-[hsl(var(--primary))/0.1]'
                  )}
                >
                  <span className="text-sm text-[hsl(var(--foreground))] truncate pr-4">
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </span>
                  {selectedDevice === device.deviceId && (
                    <Check className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />
                  )}
                </button>
              ))}
              {devices.length === 0 && (
                <div className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                  No microphones found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sensitivity Slider */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Input Sensitivity</span>
          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
            {Math.round(sensitivity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sensitivity}
          onChange={(e) => onSensitivityChange?.(parseFloat(e.target.value))}
          className={clsx(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-[hsl(var(--muted))]',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--primary))]',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer'
          )}
        />
      </div>

      {/* Status Row */}
      <div className="px-5 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.2]">
        <div className="flex items-center justify-between">
          {/* Status Chips */}
          <div className="flex items-center gap-2">
            {/* Noise Suppression */}
            <div className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              noiseSuppression 
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            )}>
              <Shield className="w-3 h-3" />
              <span>NS</span>
            </div>

            {/* Stream Health */}
            <div className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              'bg-[hsl(var(--muted))]'
            )}>
              <div className={clsx('w-2 h-2 rounded-full', healthColors[streamHealth])} />
              <span className="text-[hsl(var(--foreground))] capitalize">{streamHealth}</span>
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                <Circle className="w-2 h-2 fill-current" />
                <span>REC</span>
              </div>
            )}
          </div>

          {/* Main Control Button */}
          <button
            onClick={onToggleRecording}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all',
              isRecording
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
            )}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
