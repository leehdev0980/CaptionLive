import { clsx } from 'clsx';

export default function Card({ children, className, title, subtitle, actions, padding = true }) {
  return (
    <section
      className={clsx(
        'rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden',
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx(padding && 'p-4')}>{children}</div>
    </section>
  );
}
