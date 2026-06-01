import {
  Activity,
  Languages,
  Wifi,
  Mic,
  Timer,
  X,
  ChevronRight,
  Volume2
} from 'lucide-react';
import clsx from 'clsx';

function StatusCard({ icon: Icon, label, value, status = 'normal', accent = false }) {
  const statusColors = {
    normal: 'text-[hsl(var(--foreground))]',
    good: 'text-[hsl(var(--success))]',
    warning: 'text-[hsl(var(--warning))]',
    error: 'text-[hsl(var(--destructive))]'
  };

  return (
    <div className={clsx(
      "p-3 rounded-xl border transition-smooth",
      accent
        ? "bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]/20"
        : "bg-[hsl(var(--muted))]/50 border-[hsl(var(--border))]"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={clsx(
          "w-4 h-4",
          accent ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
        )} />
        <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</span>
      </div>
      <p className={clsx("text-sm font-semibold", statusColors[status])}>
        {value}
      </p>
    </div>
  );
}

function AudioLevel({ level = 65 }) {
  const bars = 12;
  const activeBars = Math.round((level / 100) * bars);

  return (
    <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-[hsl(var(--primary))]" />
        <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Audio Input</span>
      </div>
      
      <div className="flex items-end gap-1 h-8">
        {Array.from({ length: bars }).map((_, i) => {
          const isActive = i < activeBars;
          const height = 30 + (i * 5);
          let color = 'bg-[hsl(var(--success))]';
          if (i >= bars - 3) color = 'bg-[hsl(var(--destructive))]';
          else if (i >= bars - 5) color = 'bg-[hsl(var(--warning))]';

          return (
            <div
              key={i}
              className={clsx(
                "flex-1 rounded-sm transition-all duration-100",
                isActive ? color : "bg-[hsl(var(--border))]"
              )}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
      
      <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-2">{level}%</p>
    </div>
  );
}

function MicrophoneCard({ micName = "Default Microphone", isActive = true }) {
  return (
    <div className={clsx(
      "p-4 rounded-xl border transition-smooth",
      isActive
        ? "bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20"
        : "bg-[hsl(var(--muted))]/50 border-[hsl(var(--border))]"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isActive
              ? "bg-[hsl(var(--success))]/15"
              : "bg-[hsl(var(--muted))]"
          )}>
            <Mic className={clsx(
              "w-5 h-5",
              isActive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--muted-foreground))]"
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{micName}</p>
            <p className={clsx(
              "text-xs",
              isActive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--muted-foreground))]"
            )}>
              {isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
      </div>
    </div>
  );
}

function SessionTimer({ duration = "00:45:32" }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/5 border border-[hsl(var(--primary))]/20">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="w-4 h-4 text-[hsl(var(--primary))]" />
        <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Session Time</span>
      </div>
      <p className="text-2xl font-mono font-bold text-[hsl(var(--foreground))] tracking-wider">
        {duration}
      </p>
    </div>
  );
}

export default function UtilityPanel({ isOpen = true, onClose }) {
  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full border-l border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">System Status</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-smooth"
        >
          <X className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Session Timer */}
        <SessionTimer duration="00:45:32" />

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            icon={Activity}
            label="Latency"
            value="45ms"
            status="good"
          />
          <StatusCard
            icon={Languages}
            label="Translation"
            value="Active"
            status="good"
            accent
          />
          <StatusCard
            icon={Wifi}
            label="WebSocket"
            value="Connected"
            status="good"
          />
          <StatusCard
            icon={Activity}
            label="Stream"
            value="Healthy"
            status="good"
          />
        </div>

        {/* Audio Level */}
        <AudioLevel level={72} />

        {/* Microphone Card */}
        <MicrophoneCard micName="Built-in Microphone" isActive={true} />
      </div>
    </aside>
  );
}
