import { useState } from 'react';
import { clsx } from 'clsx';
import {
  Download,
  FileText,
  Subtitles,
  Save,
  Sparkles,
  Copy,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-react';

function ExportButton({
  icon: Icon,
  label,
  description,
  onClick,
  loading = false,
  success = false,
  variant = 'default'
}) {
  const variants = {
    default: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 border-[hsl(var(--border))]',
    primary: 'bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20 border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))]',
    accent: 'bg-[hsl(var(--accent))]/10 hover:bg-[hsl(var(--accent))]/20 border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))]'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={clsx(
        'flex items-center gap-3 w-full px-4 py-3 rounded-lg border',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]',
        variants[variant]
      )}
    >
      <div className={clsx(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        variant === 'default' && 'bg-[hsl(var(--card))]',
        variant === 'primary' && 'bg-[hsl(var(--primary))]/20',
        variant === 'accent' && 'bg-[hsl(var(--accent))]/20'
      )}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <Check className="w-4 h-4 text-[hsl(var(--success))]" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">
          {label}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      </div>
      <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))] -rotate-90" />
    </button>
  );
}

export function ExportPanel({
  captions = [],
  sessionId = 'session-1',
  className
}) {
  const [loadingStates, setLoadingStates] = useState({});
  const [successStates, setSuccessStates] = useState({});

  const setLoading = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const setSuccess = (key) => {
    setSuccessStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSuccessStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleExportTranscript = async () => {
    setLoading('transcript', true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const content = captions.map(c => 
      `[${c.timestamp}] ${c.english}${c.swahili ? `\n[SW] ${c.swahili}` : ''}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setLoading('transcript', false);
    setSuccess('transcript');
  };

  const handleDownloadSubtitles = async () => {
    setLoading('subtitles', true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate SRT format
    const srt = captions.map((c, i) => {
      const startTime = '00:00:' + String(i * 3).padStart(2, '0') + ',000';
      const endTime = '00:00:' + String((i + 1) * 3).padStart(2, '0') + ',000';
      return `${i + 1}\n${startTime} --> ${endTime}\n${c.english}\n`;
    }).join('\n');
    
    const blob = new Blob([srt], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles-${sessionId}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setLoading('subtitles', false);
    setSuccess('subtitles');
  };

  const handleSaveSession = async () => {
    setLoading('save', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading('save', false);
    setSuccess('save');
  };

  const handleGenerateSummary = async () => {
    setLoading('summary', true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading('summary', false);
    setSuccess('summary');
  };

  const handleCopyTranscript = async () => {
    setLoading('copy', true);
    const content = captions.map(c => c.english).join('\n');
    await navigator.clipboard.writeText(content);
    setLoading('copy', false);
    setSuccess('copy');
  };

  return (
    <div className={clsx(
      'bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))]',
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Export & Actions
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Download or share session data
        </p>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <ExportButton
          icon={FileText}
          label="Export Transcript"
          description="Plain text with timestamps"
          onClick={handleExportTranscript}
          loading={loadingStates.transcript}
          success={successStates.transcript}
        />
        
        <ExportButton
          icon={Subtitles}
          label="Download Subtitles"
          description="SRT format for video"
          onClick={handleDownloadSubtitles}
          loading={loadingStates.subtitles}
          success={successStates.subtitles}
        />
        
        <ExportButton
          icon={Save}
          label="Save Session"
          description="Store to cloud archive"
          onClick={handleSaveSession}
          loading={loadingStates.save}
          success={successStates.save}
          variant="primary"
        />
        
        <ExportButton
          icon={Sparkles}
          label="Generate Summary"
          description="AI-powered key points"
          onClick={handleGenerateSummary}
          loading={loadingStates.summary}
          success={successStates.summary}
          variant="accent"
        />
        
        <ExportButton
          icon={Copy}
          label="Copy Transcript"
          description="Copy to clipboard"
          onClick={handleCopyTranscript}
          loading={loadingStates.copy}
          success={successStates.copy}
        />
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[hsl(var(--muted-foreground))]">
            {captions.length} captions ready
          </span>
          <span className="text-[hsl(var(--muted-foreground))]">
            ~{Math.ceil(captions.length * 0.5)}KB
          </span>
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;
