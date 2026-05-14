import { FileText, Clock, Languages, Zap } from 'lucide-react';
import clsx from 'clsx';

function StatCard({ icon: Icon, label, value, trend, accent = false }) {
  return (
    <div className={clsx(
      "p-5 rounded-2xl border transition-smooth",
      accent
        ? "bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/5 border-[hsl(var(--primary))]/20"
        : "bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/30"
    )}>
      <div className="flex items-start justify-between">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          accent
            ? "bg-[hsl(var(--primary))]/15"
            : "bg-[hsl(var(--muted))]"
        )}>
          <Icon className={clsx(
            "w-5 h-5",
            accent ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
          )} />
        </div>
        {trend && (
          <span className={clsx(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend.positive
              ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function QuickStats({ captions = [], sessionDuration = "00:45:32" }) {
  const wordCount = captions.reduce((acc, c) => {
    return acc + (c.english?.split(' ').length || 0);
  }, 0);

  const translatedCount = captions.filter(c => c.swahili).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FileText}
        label="Total Captions"
        value={captions.length.toString()}
        trend={{ value: "+12%", positive: true }}
      />
      <StatCard
        icon={Clock}
        label="Session Duration"
        value={sessionDuration}
        accent
      />
      <StatCard
        icon={Languages}
        label="Translations"
        value={translatedCount.toString()}
        trend={{ value: `${Math.round((translatedCount / Math.max(captions.length, 1)) * 100)}%`, positive: true }}
      />
      <StatCard
        icon={Zap}
        label="Words Processed"
        value={wordCount.toLocaleString()}
      />
    </div>
  );
}
