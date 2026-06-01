import { Download, Search, Filter } from 'lucide-react';
import WorkspaceCard from '../ui/WorkspaceCard';
import clsx from 'clsx';

function TranscriptEntry({ english, swahili, timestamp, isNew = false }) {
  return (
    <div className={clsx(
      "p-4 border-b border-[hsl(var(--border))] last:border-0 transition-smooth hover:bg-[hsl(var(--muted))]/50",
      isNew && "bg-[hsl(var(--primary))]/5"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">
            <span className="text-[hsl(var(--muted-foreground))] font-medium mr-2">EN:</span>
            {english}
          </p>
          {swahili && (
            <p className="text-sm text-[hsl(var(--primary))] leading-relaxed">
              <span className="text-[hsl(var(--muted-foreground))] font-medium mr-2">SW:</span>
              {swahili}
            </p>
          )}
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono whitespace-nowrap">
          {timestamp}
        </span>
      </div>
    </div>
  );
}

export default function TranscriptHistory({ captions = [] }) {
  const headerActions = (
    <>
      <button className="h-8 px-3 rounded-lg bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-smooth">
        <Filter className="w-4 h-4" />
        Filter
      </button>
      <button className="h-8 px-3 rounded-lg bg-[hsl(var(--primary))] text-sm text-[hsl(var(--primary-foreground))] font-medium flex items-center gap-2 hover:opacity-90 transition-smooth">
        <Download className="w-4 h-4" />
        Export
      </button>
    </>
  );

  return (
    <WorkspaceCard
      title="Transcript History"
      subtitle={`${captions.length} entries`}
      headerActions={headerActions}
      padding={false}
    >
      {/* Search */}
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search transcripts..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[hsl(var(--secondary))] border border-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none transition-smooth"
          />
        </div>
      </div>

      {/* Transcript List */}
      <div className="max-h-[400px] overflow-y-auto">
        {captions.length > 0 ? (
          captions.slice().reverse().map((caption, index) => (
            <TranscriptEntry
              key={index}
              english={caption.english}
              swahili={caption.swahili}
              timestamp={caption.timestamp}
              isNew={index === 0}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No transcripts yet. Start a session to see captions here.
            </p>
          </div>
        )}
      </div>
    </WorkspaceCard>
  );
}
