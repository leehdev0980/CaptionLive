import { useState } from 'react';
import { 
  Shield,
  Check,
  X,
  AlertTriangle,
  Edit3,
  Send,
  Clock,
  RefreshCw,
  Volume2,
  VolumeX,
  Route,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

// Mock moderation queue items
const MOCK_QUEUE = [
  { id: 1, text: 'This is a sample caption that needs review', lang: 'EN', priority: 'low', timestamp: '12:34:56' },
  { id: 2, text: 'Potential issue detected in translation', lang: 'SW', priority: 'medium', timestamp: '12:34:58' },
  { id: 3, text: 'Flagged content for review', lang: 'EN', priority: 'high', timestamp: '12:35:02' }
];

function QueueItem({ item, onApprove, onReject, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priorityColors = {
    low: 'bg-emerald-500/20 text-emerald-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className={clsx(
      "border border-[hsl(var(--border))] rounded overflow-hidden",
      item.priority === 'high' && "border-red-500/30"
    )}>
      <div 
        className="p-2 flex items-start gap-2 cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={clsx(
          "shrink-0 text-[9px] font-bold px-1 py-0.5 rounded uppercase",
          priorityColors[item.priority]
        )}>
          {item.priority}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[hsl(var(--foreground))] truncate">
            {item.text}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">
              {item.timestamp}
            </span>
            <span className="text-[9px] font-bold text-[hsl(var(--primary))]">
              {item.lang}
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-3 h-3 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
      </div>
      
      {isExpanded && (
        <div className="p-2 pt-0 flex items-center gap-1">
          <button
            onClick={() => onApprove(item.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/30 transition-colors"
          >
            <Check className="w-3 h-3" />
            Approve
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-[10px] font-medium hover:bg-[hsl(var(--border))] transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => onReject(item.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-red-500/20 text-red-400 text-[10px] font-medium hover:bg-red-500/30 transition-colors"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModerationPanel({
  isRecording = false,
  isMuted = false,
  onMute,
  onCorrectionSubmit,
  className
}) {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [correctionText, setCorrectionText] = useState('');
  const [translationConfidence, setTranslationConfidence] = useState(85);

  const handleApprove = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleEdit = (id) => {
    const item = queue.find(i => i.id === id);
    if (item) {
      setCorrectionText(item.text);
    }
  };

  const handleSubmitCorrection = () => {
    if (correctionText.trim()) {
      onCorrectionSubmit?.(correctionText);
      setCorrectionText('');
    }
  };

  return (
    <div className={clsx(
      "h-full flex flex-col bg-[hsl(var(--background))]",
      className
    )}>
      {/* Panel Header */}
      <div className="broadcast-panel-header flex items-center justify-between rounded-t">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          <span>Moderation</span>
          {queue.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {queue.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Moderation Queue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Review Queue
            </span>
            <button className="text-[10px] text-[hsl(var(--primary))] hover:underline">
              Clear All
            </button>
          </div>
          
          {queue.length > 0 ? (
            <div className="space-y-1.5">
              {queue.map(item => (
                <QueueItem
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-[hsl(var(--muted-foreground))] text-xs">
              Queue is empty
            </div>
          )}
        </div>

        {/* Caption Correction Input */}
        <div className="broadcast-panel rounded overflow-hidden">
          <div className="broadcast-panel-header">
            <span className="flex items-center gap-1.5">
              <Edit3 className="w-3 h-3" />
              Caption Correction
            </span>
          </div>
          <div className="p-2">
            <textarea
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="Enter corrected caption..."
              className="w-full h-16 p-2 text-xs bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded resize-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary))]"
            />
            <button
              onClick={handleSubmitCorrection}
              disabled={!correctionText.trim()}
              className={clsx(
                "w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors",
                correctionText.trim()
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
              )}
            >
              <Send className="w-3 h-3" />
              Send Correction
            </button>
          </div>
        </div>

        {/* Translation Confidence Control */}
        <div className="broadcast-panel rounded overflow-hidden">
          <div className="broadcast-panel-header">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Translation Confidence
            </span>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Min Threshold</span>
              <span className="text-xs font-mono text-[hsl(var(--foreground))]">{translationConfidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={translationConfidence}
              onChange={(e) => setTranslationConfidence(Number(e.target.value))}
              className="w-full h-1.5 bg-[hsl(var(--muted))] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[hsl(var(--primary))]"
            />
            <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
              Translations below this threshold will be flagged for review.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-2 border-t border-[hsl(var(--border))] space-y-2">
        {/* Emergency Mute */}
        <button
          onClick={onMute}
          className={clsx(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-xs font-bold uppercase transition-colors",
            isMuted
              ? "bg-red-600 text-white"
              : "bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30"
          )}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {isMuted ? 'Output Muted' : 'Emergency Mute'}
        </button>

        {/* Stream Routing */}
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 px-2 py-2 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-[10px] font-medium hover:bg-[hsl(var(--border))] transition-colors">
            <Route className="w-3 h-3" />
            Reroute
          </button>
          <button className="flex items-center justify-center gap-1.5 px-2 py-2 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-[10px] font-medium hover:bg-[hsl(var(--border))] transition-colors">
            <Trash2 className="w-3 h-3" />
            Clear Buffer
          </button>
        </div>
      </div>
    </div>
  );
}
