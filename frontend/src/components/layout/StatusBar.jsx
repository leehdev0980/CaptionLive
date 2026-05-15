import {
  Wifi,
  Circle,
  Languages,
  Mic,
  Activity,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

function StatusItem({ icon: Icon, label, value, status = 'normal' }) {
  const statusColors = {
    normal: 'text-[hsl(var(--muted-foreground))]',
    good: 'text-[hsl(var(--success))]',
    warning: 'text-[hsl(var(--warning))]',
    error: 'text-[hsl(var(--destructive))]',
    active: 'text-[hsl(var(--primary))]'
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={clsx("w-3.5 h-3.5", statusColors[status])} />
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}:</span>
      <span className={clsx("text-xs font-medium", statusColors[status])}>{value}</span>
    </div>
  );
}

export default function StatusBar({
  connectionState = 'connected',
  isRecording = true,
  languagePair = 'EN → SW',
  audioState = 'active',
  streamHealth = 'healthy',
  latency = '45ms'
}) {
  return (
    <footer className="h-8 px-4 bg-[hsl(var(--muted))] border-t border-[hsl(var(--border))] flex items-center justify-between text-xs">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <StatusItem
          icon={Wifi}
          label="Connection"
          value={connectionState === 'connected' ? 'Connected' : 'Disconnected'}
          status={connectionState === 'connected' ? 'good' : 'error'}
        />

        <div className="flex items-center gap-2">
          <Circle
            className={clsx(
              "w-2.5 h-2.5 fill-current",
              isRecording ? "text-[hsl(var(--destructive))] animate-pulse" : "text-[hsl(var(--muted-foreground))]"
            )}
          />
          <span className={clsx(
            "text-xs font-medium",
            isRecording ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--muted-foreground))]"
          )}>
            {isRecording ? 'REC' : 'STOPPED'}
          </span>
        </div>

        <StatusItem
          icon={Languages}
          label="Language"
          value={languagePair}
          status="active"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        <StatusItem
          icon={Mic}
          label="Audio"
          value={audioState === 'active' ? 'Active' : 'Muted'}
          status={audioState === 'active' ? 'good' : 'warning'}
        />

        <StatusItem
          icon={Activity}
          label="Stream"
          value={streamHealth}
          status={streamHealth === 'healthy' ? 'good' : 'warning'}
        />

        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Low Latency:</span>
          <span className="text-xs font-medium text-[hsl(var(--primary))]">{latency}</span>
        </div>
      </div>
    </footer>
  );
}
