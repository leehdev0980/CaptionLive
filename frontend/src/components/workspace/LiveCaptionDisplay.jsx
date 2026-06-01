import { Radio } from 'lucide-react';
import clsx from 'clsx';

export default function LiveCaptionDisplay({
  primaryText = "",
  translatedText = "",
  timestamp = "",
  isLive = true,
  placeholder = "Start speaking to see live captions..."
}) {
  const hasContent = primaryText || translatedText;

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium",
            isLive
              ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          )}>
            <Radio className={clsx("w-3 h-3", isLive && "animate-pulse")} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Live Caption Feed</span>
        </div>
        {timestamp && (
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
            {timestamp}
          </span>
        )}
      </div>

      {/* Caption Content */}
      <div className="p-6 min-h-[140px]">
        {hasContent ? (
          <div className="space-y-4">
            {/* Primary Text */}
            <p className="text-2xl font-semibold text-[hsl(var(--foreground))] leading-relaxed">
              {primaryText}
            </p>

            {/* Translated Text */}
            {translatedText && (
              <p className="text-xl text-[hsl(var(--primary))] leading-relaxed italic">
                {translatedText}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[100px]">
            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              {placeholder}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
