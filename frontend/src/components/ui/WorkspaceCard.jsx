import clsx from 'clsx';

export default function WorkspaceCard({
  children,
  className,
  title,
  subtitle,
  headerActions,
  padding = true,
  glass = false
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[hsl(var(--border))] overflow-hidden",
        glass
          ? "glass"
          : "bg-[hsl(var(--card))]",
        className
      )}
    >
      {/* Card Header */}
      {(title || headerActions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className={clsx(padding && "p-5")}>
        {children}
      </div>
    </div>
  );
}
