import { clsx } from 'clsx';

export default function StatusPill({ icon: Icon, label, tone = 'muted' }) {
  const tones = {
    muted: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
    good: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
    warn: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]',
    bad: 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]',
    primary: 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
  };

  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', tones[tone])}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
