import { useState } from 'react';
import { clsx } from 'clsx';
import {
  Play,
  Pause,
  Clock,
  Cloud,
  CloudOff,
  HardDrive,
  Eye,
  EyeOff,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  ChevronRight
} from 'lucide-react';

function ActiveSessionCard({
  sessionId,
  sessionName,
  duration,
  isRecording,
  captionCount,
  status = 'active'
}) {
  const statusConfig = {
    active: {
      color: 'bg-[hsl(var(--success))]',
      label: 'Recording',
      pulse: true
    },
    paused: {
      color: 'bg-[hsl(var(--warning))]',
      label: 'Paused',
      pulse: false
    },
    ended: {
      color: 'bg-[hsl(var(--muted-foreground))]',
      label: 'Ended',
      pulse: false
    }
  };

  const config = statusConfig[status];

  return (
    <div className="bg-[hsl(var(--muted))] rounded-lg p-4 border border-[hsl(var(--border-bright))]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              config.color,
              config.pulse && 'animate-pulse'
            )} />
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            {sessionName}
          </h4>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            ID: {sessionId}
          </p>
        </div>
        <button className="p-1.5 rounded hover:bg-[hsl(var(--card))] transition-colors">
          <MoreHorizontal className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{duration}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
          <span>{captionCount} captions</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[hsl(var(--border))]">
        <button className={clsx(
          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium',
          'transition-colors',
          isRecording
            ? 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20'
            : 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20'
        )}>
          {isRecording ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Resume
            </>
          )}
        </button>
        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          End
        </button>
      </div>
    </div>
  );
}

function RecentSessionItem({ session, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
          {session.name}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {session.date} · {session.duration}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function SessionManager({
  currentSession = {
    id: 'sess_abc123',
    name: 'Live Broadcast Session',
    duration: '00:45:32',
    isRecording: true,
    captionCount: 156
  },
  recentSessions = [
    { id: 'sess_xyz789', name: 'Morning Keynote', date: 'Today', duration: '01:23:45' },
    { id: 'sess_def456', name: 'Panel Discussion', date: 'Yesterday', duration: '00:58:12' },
    { id: 'sess_ghi012', name: 'Press Conference', date: 'May 12', duration: '00:32:18' }
  ],
  storageUsed = 2.4,
  storageTotal = 10,
  cloudSynced = true,
  isPublic = false,
  className
}) {
  const [visibility, setVisibility] = useState(isPublic);
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <div className={clsx(
      'bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))]',
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Session Management
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Active and archived sessions
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Session */}
        <ActiveSessionCard
          sessionId={currentSession.id}
          sessionName={currentSession.name}
          duration={currentSession.duration}
          isRecording={currentSession.isRecording}
          captionCount={currentSession.captionCount}
          status={currentSession.isRecording ? 'active' : 'paused'}
        />

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase">
              Recent Sessions
            </span>
            <button className="text-xs text-[hsl(var(--primary))] hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-0.5">
            {recentSessions.map((session) => (
              <RecentSessionItem
                key={session.id}
                session={session}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                Storage Usage
              </span>
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {storageUsed} / {storageTotal} GB
            </span>
          </div>
          <div className="h-1.5 bg-[hsl(var(--card))] rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                storagePercent > 80 ? 'bg-[hsl(var(--destructive))]' :
                storagePercent > 60 ? 'bg-[hsl(var(--warning))]' :
                'bg-[hsl(var(--primary))]'
              )}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        {/* Cloud Sync & Visibility */}
        <div className="flex items-center gap-3">
          <div className={clsx(
            'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-[hsl(var(--muted))]'
          )}>
            {cloudSynced ? (
              <Cloud className="w-4 h-4 text-[hsl(var(--success))]" />
            ) : (
              <CloudOff className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            )}
            <span className="text-xs text-[hsl(var(--foreground))]">
              {cloudSynced ? 'Synced' : 'Offline'}
            </span>
            {cloudSynced && (
              <RefreshCw className="w-3 h-3 text-[hsl(var(--muted-foreground))] ml-auto" />
            )}
          </div>

          <button
            onClick={() => setVisibility(!visibility)}
            className={clsx(
              'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg',
              'transition-colors',
              visibility
                ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
            )}
          >
            {visibility ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span className="text-xs">
              {visibility ? 'Public' : 'Private'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionManager;
