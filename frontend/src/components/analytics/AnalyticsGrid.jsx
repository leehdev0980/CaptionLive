import { clsx } from 'clsx';
import {
  Clock,
  Languages,
  Timer,
  Users,
  FileText,
  Target,
  Zap
} from 'lucide-react';
import MetricCard from './MetricCard';

export function AnalyticsGrid({
  latency = 120,
  confidence = 0.94,
  sessionDuration = '00:45:32',
  activeSpeakers = 2,
  wordsProcessed = 4823,
  captionAccuracy = 0.97,
  throughput = 156,
  className
}) {
  // Determine status based on thresholds
  const latencyStatus = latency < 150 ? 'success' : latency < 300 ? 'warning' : 'error';
  const confidenceStatus = confidence > 0.9 ? 'success' : confidence > 0.75 ? 'warning' : 'error';
  const accuracyStatus = captionAccuracy > 0.95 ? 'success' : captionAccuracy > 0.85 ? 'warning' : 'error';

  const metrics = [
    {
      label: 'Average Latency',
      value: latency,
      unit: 'ms',
      icon: Clock,
      status: latencyStatus,
      trend: 'down',
      trendValue: 12,
      subtitle: 'End-to-end delay'
    },
    {
      label: 'Translation Confidence',
      value: (confidence * 100).toFixed(1),
      unit: '%',
      icon: Languages,
      status: confidenceStatus,
      trend: 'up',
      trendValue: 3,
      subtitle: 'AI model certainty'
    },
    {
      label: 'Session Duration',
      value: sessionDuration,
      unit: '',
      icon: Timer,
      status: 'primary',
      subtitle: 'Active recording time'
    },
    {
      label: 'Active Speakers',
      value: activeSpeakers,
      unit: '',
      icon: Users,
      status: 'default',
      trend: 'up',
      trendValue: 1,
      subtitle: 'Detected voices'
    },
    {
      label: 'Words Processed',
      value: wordsProcessed.toLocaleString(),
      unit: '',
      icon: FileText,
      status: 'default',
      trend: 'up',
      trendValue: 24,
      subtitle: 'Total transcribed'
    },
    {
      label: 'Caption Accuracy',
      value: (captionAccuracy * 100).toFixed(1),
      unit: '%',
      icon: Target,
      status: accuracyStatus,
      trend: 'up',
      trendValue: 2,
      subtitle: 'Speech recognition'
    },
    {
      label: 'Realtime Throughput',
      value: throughput,
      unit: 'wpm',
      icon: Zap,
      status: throughput > 120 ? 'success' : 'warning',
      subtitle: 'Words per minute'
    }
  ];

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Session Analytics
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Real-time operational metrics
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          <span className="text-xs font-medium text-[hsl(var(--success))]">Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
          />
        ))}
      </div>
    </div>
  );
}

export default AnalyticsGrid;
