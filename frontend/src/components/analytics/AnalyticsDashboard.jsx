import { clsx } from 'clsx';
import { BarChart3, Settings } from 'lucide-react';
import AnalyticsGrid from './AnalyticsGrid';
import ExportPanel from './ExportPanel';
import SessionManager from './SessionManager';

export function AnalyticsDashboard({
  captions = [],
  isRecording = false,
  sessionStart = null,
  confidence = 0.94,
  latency = 120,
  className
}) {
  // Calculate session metrics
  const sessionDuration = sessionStart
    ? formatDuration(Date.now() - sessionStart.getTime())
    : '00:00:00';

  const wordsProcessed = captions.reduce((acc, c) => {
    return acc + (c.english?.split(' ').length || 0);
  }, 0);

  const throughput = sessionStart && wordsProcessed > 0
    ? Math.round(wordsProcessed / ((Date.now() - sessionStart.getTime()) / 60000))
    : 0;

  return (
    <div className={clsx(
      'h-full flex flex-col bg-[hsl(var(--background))]',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Analytics & Utilities
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Session insights and export tools
            </p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
          <Settings className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Analytics Grid */}
        <AnalyticsGrid
          latency={latency}
          confidence={confidence}
          sessionDuration={sessionDuration}
          activeSpeakers={2}
          wordsProcessed={wordsProcessed}
          captionAccuracy={0.97}
          throughput={throughput}
        />

        {/* Two Column Layout for Export and Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExportPanel
            captions={captions}
            sessionId="sess_abc123"
          />
          <SessionManager
            currentSession={{
              id: 'sess_abc123',
              name: 'Live Broadcast Session',
              duration: sessionDuration,
              isRecording: isRecording,
              captionCount: captions.length
            }}
          />
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  return [
    String(hours).padStart(2, '0'),
    String(minutes % 60).padStart(2, '0'),
    String(seconds % 60).padStart(2, '0')
  ].join(':');
}

export default AnalyticsDashboard;
