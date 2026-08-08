import { useEffect, useState } from "react";

interface WaveformProps {
  bars?: number;
  active?: boolean;
  className?: string;
}

export function Waveform({
  bars = 48,
  active = true,
  className,
}: WaveformProps) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: bars }, () => 20 + Math.random() * 60),
  );

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setHeights((prev) => prev.map(() => 15 + Math.random() * 75));
    }, 140);
    return () => clearInterval(id);
  }, [active, bars]);

  return (
    <div className={`flex h-full items-center gap-[3px] ${className ?? ""}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full bg-signal/80 transition-[height] duration-150 ease-out"
          style={{
            height: `${active ? h : 12}%`,
            opacity: active ? 0.5 + (h / 100) * 0.5 : 0.3,
            boxShadow:
              active && h > 60 ? "0 0 10px var(--signal-glow)" : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function StaticWaveform({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-full items-center gap-[3px] ${className ?? ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 60 }).map((_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 0.4) * 60) + Math.random() * 20;
        return (
          <div
            key={i}
            className="flex-1 rounded-full bg-signal/70"
            style={{ height: `${Math.min(h, 100)}%`, opacity: 0.4 + h / 200 }}
          />
        );
      })}
    </div>
  );
}
