import { Mic, MicOff, Languages, Settings } from 'lucide-react';
import WorkspaceCard from '../ui/WorkspaceCard';
import clsx from 'clsx';

export default function AudioControls({
  isRecording = false,
  translateEnabled = false,
  onToggleRecording,
  onToggleTranslate
}) {
  return (
    <WorkspaceCard>
      <div className="flex flex-wrap items-center gap-4">
        {/* Recording Button */}
        <button
          onClick={onToggleRecording}
          className={clsx(
            "flex items-center gap-3 h-12 px-6 rounded-xl font-medium transition-smooth",
            isRecording
              ? "bg-[hsl(var(--destructive))] text-white hover:opacity-90"
              : "bg-[hsl(var(--success))] text-white hover:opacity-90"
          )}
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Recording
            </>
          )}
        </button>

        {/* Translation Toggle */}
        <button
          onClick={onToggleTranslate}
          className={clsx(
            "flex items-center gap-3 h-12 px-6 rounded-xl font-medium border transition-smooth",
            translateEnabled
              ? "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
              : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
          )}
        >
          <Languages className="w-5 h-5" />
          Translation: {translateEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Settings */}
        <button className="ml-auto flex items-center gap-2 h-12 px-4 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-smooth">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </WorkspaceCard>
  );
}
