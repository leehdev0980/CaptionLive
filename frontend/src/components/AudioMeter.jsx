import { clsx } from 'clsx';

export default function AudioMeter({ level = 0 }) {
  const bars = 14;
  const active = Math.round((level / 100) * bars);

  return (
    <div className="flex h-10 items-end gap-1">
      {Array.from({ length: bars }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'flex-1 rounded-sm transition',
            index < active ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border-bright))]'
          )}
          style={{ height: `${24 + index * 5}%` }}
        />
      ))}
    </div>
  );
}
