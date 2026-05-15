import { useState, useEffect, useRef } from 'react';
import { 
  Clock,
  MessageSquare,
  Activity,
  Languages,
  AlertTriangle,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play
} from 'lucide-react';
import clsx from 'clsx';

// Event types and their visual representation
const EVENT_TYPES = {
  caption: { icon: MessageSquare, color: 'bg-[hsl(var(--primary))]', label: 'Caption' },
  translation: { icon: Languages, color: 'bg-amber-500', label: 'Translation' },
  audio_spike: { icon: Activity, color: 'bg-emerald-500', label: 'Audio' },
  latency: { icon: Zap, color: 'bg-purple-500', label: 'Latency' },
  moderation: { icon: Shield, color: 'bg-rose-500', label: 'Moderation' },
  warning: { icon: AlertTriangle, color: 'bg-orange-500', label: 'Warning' }
};

function TimelineEvent({ event, position, isSelected, onClick }) {
  const EventIcon = EVENT_TYPES[event.type]?.icon || MessageSquare;
  const color = EVENT_TYPES[event.type]?.color || 'bg-gray-500';
  
  return (
    <button
      onClick={() => onClick(event)}
      className={clsx(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10",
        "w-3 h-3 rounded-full transition-all",
        color,
        isSelected && "ring-2 ring-white scale-125",
        "hover:scale-125"
      )}
      style={{ left: `${position}%` }}
      title={`${EVENT_TYPES[event.type]?.label}: ${event.text}`}
    />
  );
}

function TimeMarker({ time, position }) {
  return (
    <div 
      className="absolute top-0 h-full flex flex-col items-center"
      style={{ left: `${position}%` }}
    >
      <div className="h-2 w-px bg-[hsl(var(--border-bright))]" />
      <span className="text-[8px] text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">
        {time}
      </span>
    </div>
  );
}

export default function OperationalTimeline({
  events = [],
  duration = 300, // 5 minutes in seconds
  currentTime = 0,
  isPlaying = true,
  onSeek,
  onTogglePlay,
  className
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredTime, setHoveredTime] = useState(null);
  const timelineRef = useRef(null);

  // Generate time markers (every 30 seconds)
  const timeMarkers = [];
  for (let i = 0; i <= duration; i += 30) {
    const minutes = Math.floor(i / 60);
    const seconds = i % 60;
    timeMarkers.push({
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      position: (i / duration) * 100
    });
  }

  // Calculate current playhead position
  const playheadPosition = (currentTime / duration) * 100;

  // Handle timeline click for seeking
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * duration;
    onSeek?.(Math.max(0, Math.min(duration, seekTime)));
  };

  // Calculate event positions
  const eventsWithPosition = events.map(event => ({
    ...event,
    position: (event.timestamp / duration) * 100
  }));

  // Event stats
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={clsx(
      "h-24 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]",
      "flex flex-col",
      className
    )}>
      {/* Timeline Header */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Operational Timeline
            </span>
          </div>
          
          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePlay}
              className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
            >
              {isPlaying 
                ? <Pause className="w-3 h-3 text-[hsl(var(--foreground))]" />
                : <Play className="w-3 h-3 text-[hsl(var(--foreground))]" />
              }
            </button>
          </div>

          {/* Current Time */}
          <div className="text-[10px] font-mono text-[hsl(var(--foreground))]">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
            <span className="text-[hsl(var(--muted-foreground))]"> / </span>
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {/* Event Legend */}
        <div className="flex items-center gap-3">
          {Object.entries(EVENT_TYPES).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1">
              <div className={clsx("w-2 h-2 rounded-full", config.color)} />
              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                {config.label}
                {eventCounts[type] && (
                  <span className="ml-0.5 text-[hsl(var(--foreground))]">
                    ({eventCounts[type]})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Track */}
      <div className="flex-1 px-3 py-2">
        <div 
          ref={timelineRef}
          className="relative h-full bg-[hsl(var(--background))] rounded cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Time Markers */}
          {timeMarkers.map((marker, idx) => (
            <TimeMarker key={idx} {...marker} />
          ))}

          {/* Event Track */}
          <div className="absolute inset-x-0 top-4 bottom-4">
            {/* Track Line */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-[hsl(var(--muted))] rounded-full" />
            
            {/* Progress Fill */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[hsl(var(--primary))]/30 rounded-full"
              style={{ width: `${playheadPosition}%` }}
            />

            {/* Events */}
            {eventsWithPosition.map((event, idx) => (
              <TimelineEvent
                key={idx}
                event={event}
                position={event.position}
                isSelected={selectedEvent?.id === event.id}
                onClick={setSelectedEvent}
              />
            ))}

            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-[hsl(var(--primary))] z-20"
              style={{ left: `${playheadPosition}%` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[hsl(var(--primary))] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="h-6 px-3 flex items-center gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <div className={clsx(
            "w-2 h-2 rounded-full",
            EVENT_TYPES[selectedEvent.type]?.color
          )} />
          <span className="text-[10px] text-[hsl(var(--foreground))]">
            <span className="font-medium">{EVENT_TYPES[selectedEvent.type]?.label}:</span>
            {' '}{selectedEvent.text}
          </span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            @ {Math.floor(selectedEvent.timestamp / 60)}:{(selectedEvent.timestamp % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
