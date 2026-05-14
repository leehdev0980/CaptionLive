import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function MetricCard({
  label,
  value,
  unit = '',
  icon: Icon,
  trend = null,
  trendValue = null,
  status = 'default',
  subtitle = null,
  className
}) {
  const statusColors = {
    default: 'border-[hsl(var(--border))]',
    success: 'border-[hsl(var(--success))]/30',
    warning: 'border-[hsl(var(--warning))]/30',
    error: 'border-[hsl(var(--destructive))]/30',
    primary: 'border-[hsl(var(--primary))]/30'
  };

  const statusGlow = {
    default: '',
    success: 'shadow-[0_0_20px_hsl(var(--success)/0.1)]',
    warning: 'shadow-[0_0_20px_hsl(var(--warning)/0.1)]',
    error: 'shadow-[0_0_20px_hsl(var(--destructive)/0.1)]',
    primary: 'shadow-[0_0_20px_hsl(var(--primary)/0.1)]'
  };

  const iconColors = {
    default: 'text-[hsl(var(--muted-foreground))]',
    success: 'text-[hsl(var(--success))]',
    warning: 'text-[hsl(var(--warning))]',
    error: 'text-[hsl(var(--destructive))]',
    primary: 'text-[hsl(var(--primary))]'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-[hsl(var(--success))]' : trend === 'down' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]';

  return (
    <div className={clsx(
      'bg-[hsl(var(--card))] rounded-lg border p-4',
      'hover:bg-[hsl(var(--card))]/80 transition-all duration-200',
      statusColors[status],
      statusGlow[status],
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-[hsl(var(--foreground))] tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              'bg-[hsl(var(--muted))]',
              iconColors[status]
            )}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          
          {trend && trendValue !== null && (
            <div className={clsx('flex items-center gap-1 text-xs', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span className="font-medium">{trendValue}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
