import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Copy,
  Bookmark,
  BookmarkCheck,
  Check,
  User,
  Users,
  Globe,
  ArrowDownToLine,
  Clock,
  Calendar,
  Filter,
  X,
  Mic,
  Languages,
  FileText,
  MoreHorizontal,
  ChevronUp
} from 'lucide-react';

// Mock session data for demonstration
const MOCK_SESSIONS = [
  {
    id: 'session-1',
    name: 'Morning Standup',
    date: 'Today',
    startTime: '09:00 AM',
    duration: '32 min',
    entryCount: 47
  },
  {
    id: 'session-2', 
    name: 'Product Review',
    date: 'Today',
    startTime: '11:30 AM',
    duration: '58 min',
    entryCount: 89
  },
  {
    id: 'session-3',
    name: 'Client Call',
    date: 'Yesterday',
    startTime: '02:15 PM',
    duration: '45 min',
    entryCount: 62
  }
];

const SPEAKERS = [
  { id: 'all', name: 'All Speakers', icon: Users },
  { id: 'speaker-1', name: 'Speaker 1', icon: User },
  { id: 'speaker-2', name: 'Speaker 2', icon: User },
  { id: 'speaker-3', name: 'Speaker 3', icon: User }
];

const LANGUAGES = [
  { id: 'all', name: 'All Languages', code: 'ALL' },
  { id: 'en', name: 'English', code: 'EN' },
  { id: 'sw', name: 'Kiswahili', code: 'SW' }
];

// Dropdown Component
function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={clsx(
          "absolute top-full mt-2 z-50 min-w-[200px] py-2 rounded-xl",
          "bg-[hsl(var(--card))] border border-[hsl(var(--border))]",
          "shadow-xl shadow-black/20",
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ children, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-smooth",
        active 
          ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
          : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
      )}
    >
      {children}
    </button>
  );
}

// Single Transcript Entry
function TranscriptEntry({ 
  entry, 
  isActive = false, 
  isLive = false,
  onCopy,
  onBookmark 
}) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(entry.bookmarked || false);

  const handleCopy = () => {
    const text = `${entry.english}\n${entry.swahili || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(entry);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.(entry, !bookmarked);
  };

  const confidenceColor = entry.confidence >= 0.9 
    ? 'text-[hsl(var(--success))]' 
    : entry.confidence >= 0.75 
      ? 'text-[hsl(var(--warning))]' 
      : 'text-[hsl(var(--destructive))]';

  return (
    <div className={clsx(
      "group relative px-5 py-4 transition-all duration-300",
      isActive && "bg-[hsl(var(--primary))]/8",
      isLive && "bg-[hsl(var(--primary))]/5 border-l-2 border-[hsl(var(--primary))]",
      !isActive && !isLive && "hover:bg-[hsl(var(--muted))]/50"
    )}>
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute left-5 top-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--primary))] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--primary))]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
            Live
          </span>
        </div>
      )}

      {/* Entry Content */}
      <div className={clsx("space-y-3", isLive && "mt-6")}>
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Speaker Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                <User className="w-3 h-3 text-[hsl(var(--primary-foreground))]" />
              </div>
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                {entry.speaker || 'Speaker 1'}
              </span>
            </div>

            {/* Timestamp */}
            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
              {entry.timestamp}
            </span>

            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div 
                  className={clsx(
                    "h-full rounded-full transition-all",
                    entry.confidence >= 0.9 ? "bg-[hsl(var(--success))]" :
                    entry.confidence >= 0.75 ? "bg-[hsl(var(--warning))]" :
                    "bg-[hsl(var(--destructive))]"
                  )}
                  style={{ width: `${(entry.confidence || 0.95) * 100}%` }}
                />
              </div>
              <span className={clsx("text-[10px] font-mono", confidenceColor)}>
                {Math.round((entry.confidence || 0.95) * 100)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-smooth"
              aria-label="Copy transcript"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[hsl(var(--success))]" />
              ) : (
                <Copy className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              )}
            </button>
            <button
              onClick={handleBookmark}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-smooth"
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-[hsl(var(--primary))]" />
              ) : (
                <Bookmark className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              )}
            </button>
          </div>
        </div>

        {/* Transcript Text */}
        <div className="space-y-2">
          {/* English */}
          <p className={clsx(
            "text-base leading-relaxed text-[hsl(var(--foreground))]",
            isLive && "text-lg font-medium"
          )}>
            {entry.english}
            {isLive && (
              <span className="inline-block w-0.5 h-5 ml-1 bg-[hsl(var(--primary))] animate-pulse" />
            )}
          </p>

          {/* Kiswahili Translation */}
          {entry.swahili && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                SW
              </span>
              <p className="text-sm leading-relaxed text-[hsl(var(--primary))] italic">
                {entry.swahili}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent" />
    </div>
  );
}

// Session Group Component
function SessionGroup({ session, entries, isExpanded, onToggle, activeEntryId, liveEntryId }) {
  return (
    <div className="border-b border-[hsl(var(--border))] last:border-0">
      {/* Session Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[hsl(var(--muted))]/30 transition-smooth"
      >
        <div className="flex items-center gap-4">
          <div className={clsx(
            "p-2 rounded-xl transition-colors",
            isExpanded ? "bg-[hsl(var(--primary))]/10" : "bg-[hsl(var(--secondary))]"
          )}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[hsl(var(--primary))]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            )}
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[hsl(var(--foreground))]">
                {session.name}
              </h3>
              {session.date === 'Today' && liveEntryId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {session.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.startTime}
              </span>
              <span>{session.duration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            {session.entryCount} entries
          </span>
        </div>
      </button>

      {/* Session Entries */}
      {isExpanded && (
        <div className="bg-[hsl(var(--background))]/50">
          {entries.map((entry, index) => (
            <TranscriptEntry
              key={entry.id || index}
              entry={entry}
              isActive={entry.id === activeEntryId}
              isLive={entry.id === liveEntryId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Transcript Timeline Component
export default function TranscriptTimeline({ 
  captions = [],
  currentSessionId = 'session-1',
  className 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedSession, setSelectedSession] = useState(currentSessionId);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState([currentSessionId]);
  const scrollRef = useRef(null);

  // Process captions into entries with IDs
  const entries = captions.map((caption, index) => ({
    ...caption,
    id: `entry-${index}`,
    speaker: caption.speaker || 'Speaker 1',
    confidence: caption.confidence || 0.92 + Math.random() * 0.07
  }));

  // Get the live entry (most recent)
  const liveEntryId = entries.length > 0 ? entries[entries.length - 1].id : null;

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.swahili?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpeaker = selectedSpeaker === 'all' || entry.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll]);

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleExport = () => {
    const text = entries.map(e => 
      `[${e.timestamp}] ${e.speaker}: ${e.english}${e.swahili ? `\n  → ${e.swahili}` : ''}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearSearch = () => setSearchQuery('');

  return (
    <div className={clsx(
      "flex flex-col h-full rounded-2xl overflow-hidden",
      "bg-[hsl(var(--card))] border border-[hsl(var(--border))]",
      "shadow-xl shadow-black/10",
      className
    )}>
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--accent))]/10">
              <FileText className="w-5 h-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Transcript Timeline
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {entries.length} entries across {MOCK_SESSIONS.length} sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-scroll Toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={clsx(
                "h-9 px-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-smooth",
                autoScroll 
                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
              )}
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-xl bg-[hsl(var(--primary))] text-sm font-medium text-[hsl(var(--primary-foreground))] flex items-center gap-2 hover:opacity-90 transition-smooth"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcripts..."
              className="w-full h-10 pl-10 pr-10 rounded-xl bg-[hsl(var(--secondary))] border border-transparent text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none transition-smooth"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[hsl(var(--muted))] transition-smooth"
              >
                <X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>

          {/* Speaker Filter */}
          <Dropdown
            trigger={
              <button className="h-10 px-4 rounded-xl bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--foreground))] flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-smooth">
                <User className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span>{SPEAKERS.find(s => s.id === selectedSpeaker)?.name || 'All Speakers'}</span>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </button>
            }
          >
            {SPEAKERS.map(speaker => (
              <DropdownItem
                key={speaker.id}
                onClick={() => setSelectedSpeaker(speaker.id)}
                active={selectedSpeaker === speaker.id}
              >
                <speaker.icon className="w-4 h-4" />
                {speaker.name}
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Language Filter */}
          <Dropdown
            trigger={
              <button className="h-10 px-4 rounded-xl bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--foreground))] flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-smooth">
                <Globe className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span>{LANGUAGES.find(l => l.id === selectedLanguage)?.name || 'All Languages'}</span>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </button>
            }
          >
            {LANGUAGES.map(lang => (
              <DropdownItem
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                active={selectedLanguage === lang.id}
              >
                <span className="w-6 text-center text-xs font-mono text-[hsl(var(--muted-foreground))]">
                  {lang.code}
                </span>
                {lang.name}
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Session Selector */}
          <Dropdown
            align="right"
            trigger={
              <button className="h-10 px-4 rounded-xl bg-[hsl(var(--secondary))] text-sm text-[hsl(var(--foreground))] flex items-center gap-2 hover:bg-[hsl(var(--muted))] transition-smooth">
                <Calendar className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span>{MOCK_SESSIONS.find(s => s.id === selectedSession)?.name || 'All Sessions'}</span>
                <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              </button>
            }
          >
            {MOCK_SESSIONS.map(session => (
              <DropdownItem
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                active={selectedSession === session.id}
              >
                <div className="flex flex-col">
                  <span>{session.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {session.date} at {session.startTime}
                  </span>
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        {filteredEntries.length > 0 ? (
          /* Flat timeline view for current session */
          <div>
            {filteredEntries.map((entry, index) => (
              <TranscriptEntry
                key={entry.id}
                entry={entry}
                isActive={false}
                isLive={entry.id === liveEntryId}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-4 rounded-2xl bg-[hsl(var(--secondary))] mb-4">
              <Mic className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
              {searchQuery ? 'No matching transcripts' : 'No transcripts yet'}
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'Start a recording session to see real-time captions and translations appear here.'}
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-smooth"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="shrink-0 px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              {entries.filter(e => e.swahili).length} translated
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              0 bookmarked
            </span>
          </div>
          <span>
            Showing {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}
