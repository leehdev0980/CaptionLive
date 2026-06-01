import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Activity,
  ArrowLeft,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Languages,
  Mic,
  MicOff,
  Radio,
  Search,
  Subtitles,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react';

import Card from '../components/Card';
import StatusPill from '../components/StatusPill';
import AudioMeter from '../components/AudioMeter';

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatHMS(totalSeconds = 0) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function countWords(captions) {
  return captions.reduce((total, caption) => {
    return total + (caption.english || '').trim().split(/\s+/).filter(Boolean).length;
  }, 0);
}

export default function Workstation({
  sessionTitle,
  sessionSource,
  captions,
  latestCaption,
  isRecording,
  status,
  isConnected,
  translate,
  audioLevel,
  isSpeaking,
  micNotice,
  latency,
  errorMessage,
  reviewItems,
  sessionDurationSeconds = 0,
  onToggleRecording,
  onToggleTranslate,
  onClearHistory,
  onApproveReview,
  onUpdateReview,
  onDiscardReview,
  onBackToLanding
}) {
  const [query, setQuery] = useState('');
  const sessionSeconds = latestCaption?.sessionSeconds ?? sessionDurationSeconds ?? 0;

  const filteredCaptions = captions.filter((caption) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${caption.english} ${caption.swahili}`.toLowerCase().includes(needle);
  });

  const stats = useMemo(() => {
    const translated = captions.filter((caption) => caption.swahili).length;
    return {
      captionCount: captions.length,
      words: countWords(captions),
      translated,
      sessionTime: formatHMS(sessionSeconds)
    };
  }, [captions, sessionSeconds]);

  const transcriptText = captions
    .slice()
    .reverse()
    .map(
      (caption) =>
        `[${caption.timestamp}] EN: ${caption.english || ''}${caption.swahili ? `\nSW: ${caption.swahili}` : ''}`
    )
    .join('\n\n');

  const exportTranscript = () => {
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sessionTitle.replace(/[^\w-]+/g, '-').toLowerCase() || 'caption-session'}-transcript.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportSrt = () => {
    const srt = captions
      .slice()
      .reverse()
      .map((caption, index) => {
        const start = String(index * 3).padStart(2, '0');
        const end = String(index * 3 + 3).padStart(2, '0');
        return `${index + 1}\n00:00:${start},000 --> 00:00:${end},000\n${caption.english || ''}${
          caption.swahili ? `\n${caption.swahili}` : ''
        }`;
      })
      .join('\n\n');

    const blob = new Blob([srt], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sessionTitle.replace(/[^\w-]+/g, '-').toLowerCase() || 'caption-session'}.srt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcriptText);
  };

  return (
    <main className="h-screen overflow-y-auto bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-4 w-4" />
            New session
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">{sessionTitle}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{sessionSource}</p>
          </div>

          <StatusPill
            icon={isConnected ? Wifi : WifiOff}
            label={isConnected ? 'Connected' : 'Disconnected'}
            tone={isConnected ? 'good' : 'bad'}
          />

          <StatusPill
            icon={translate ? Languages : XCircle}
            label={translate ? 'Translation on' : 'Translation off'}
            tone={translate ? 'primary' : 'muted'}
          />
        </div>

        {/* DEBUG: captions arriving? */}
        <div className="mx-auto mt-2 max-w-7xl text-[10px] text-[hsl(var(--muted-foreground))]">
          DEBUG captions.length={captions?.length ?? 0} latestCaption={latestCaption ? 'SET' : 'null'}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 p-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Card
            title="Caption monitor"
            subtitle={isRecording ? 'Listening for speech' : 'Ready for recording or imported results'}
            actions={
              <StatusPill icon={isRecording ? Radio : Clock} label={isRecording ? 'Live' : status} tone={isRecording ? 'bad' : 'muted'} />
            }
          >
            <div className="min-h-56 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5">
              {latestCaption ? (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded bg-[hsl(var(--primary))]/15 px-2 py-1 text-xs font-bold text-[hsl(var(--primary))]">
                        EN
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{latestCaption.timestamp}</span>

                      {latestCaption.status === 'review' && (
                        <span className="inline-flex items-center gap-1 rounded bg-[hsl(var(--warning))]/15 px-2 py-1 text-xs font-semibold text-[hsl(var(--warning))]">
                          <AlertTriangle className="h-3 w-3" />
                          Needs review
                        </span>
                      )}

                      {latestCaption.confidence !== undefined && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {(latestCaption.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-semibold leading-relaxed sm:text-3xl">
                      {latestCaption.english || 'No speech detected in this segment.'}
                    </p>
                  </div>

                  {translate && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-[hsl(var(--accent))]/15 px-2 py-1 text-xs font-bold text-[hsl(var(--accent))]">
                          SW
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Kiswahili translation</span>
                      </div>
                      <p className="text-xl leading-relaxed text-[hsl(var(--foreground))]">
                        {latestCaption.swahili || 'Translation will appear when available.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-44 flex-col items-center justify-center text-center">
                  <Mic className="mb-4 h-8 w-8 text-[hsl(var(--primary))]" />
                  <p className="text-lg font-semibold">Start recording or import media to see captions.</p>
                  <p className="mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
                    Your transcript will appear here as soon as the backend returns captions.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Transcript history"
            subtitle={`${filteredCaptions.length} of ${captions.length} entries`}
            actions={
              captions.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="rounded-md bg-[hsl(var(--destructive))]/15 px-3 py-2 text-xs font-semibold text-[hsl(var(--destructive))]"
                >
                  Clear
                </button>
              )
            }
            padding={false}
          >
            <div className="border-b border-[hsl(var(--border))] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search transcript"
                  className="h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
                />
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {filteredCaptions.length === 0 ? (
                <p className="p-6 text-center text-sm text-[hsl(var(--muted-foreground))]">No matching captions yet.</p>
              ) : (
                filteredCaptions.map((caption, index) => (
                  <article
                    key={`${caption.timestamp}-${index}`}
                    className="border-b border-[hsl(var(--border))] p-4 last:border-0"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{caption.timestamp}</span>
                      <div className="flex items-center gap-2">
                        {caption.status === 'review' && (
                          <span className="rounded bg-[hsl(var(--warning))]/15 px-2 py-0.5 text-xs font-semibold text-[hsl(var(--warning))]">
                            Review
                          </span>
                        )}
                        {caption.confidence !== undefined && (
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{(caption.confidence * 100).toFixed(0)}%</span>
                        )}
                        {caption.source && <span className="text-xs text-[hsl(var(--muted-foreground))]">{caption.source}</span>}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-[hsl(var(--primary))]">EN:</span> {caption.english || '(silence)'}
                    </p>

                    {caption.swahili && (
                      <p className="mt-2 text-sm leading-relaxed">
                        <span className="font-semibold text-[hsl(var(--accent))]">SW:</span> {caption.swahili}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card title="Controls" subtitle="Live recording and translation">
            <div className="space-y-4">
              <button
                type="button"
                onClick={onToggleRecording}
                className={clsx(
                  'inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90',
                  isRecording ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--success))]'
                )}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? 'Stop recording' : 'Start recording'}
              </button>

              <button
                type="button"
                onClick={onToggleTranslate}
                className={clsx(
                  'inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition',
                  translate
                    ? 'border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                )}
              >
                <Languages className="h-4 w-4" />
                Translation {translate ? 'on' : 'off'}
              </button>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Audio input</span>
                  <span>{audioLevel.toFixed(0)}%</span>
                </div>
                <AudioMeter level={audioLevel} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill
                    icon={isSpeaking ? Radio : Mic}
                    label={isSpeaking ? 'Speech detected' : 'Listening for speech'}
                    tone={isSpeaking ? 'good' : 'muted'}
                  />
                  {micNotice && (
                    <StatusPill
                      icon={micNotice.type === 'warning' ? AlertTriangle : CheckCircle2}
                      label={micNotice.message}
                      tone={micNotice.type === 'warning' ? 'warn' : 'good'}
                    />
                  )}
                </div>
              </div>

              {latency !== null && <StatusPill icon={Zap} label={`${latency}ms last response`} tone="good" />}

              {errorMessage && (
                <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-sm text-[hsl(var(--destructive))]">
                  {errorMessage}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <FileText className="mb-3 h-5 w-5 text-[hsl(var(--primary))]" />
              <p className="text-2xl font-semibold">{stats.captionCount}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Captions</p>
            </Card>

            <Card>
              <Activity className="mb-3 h-5 w-5 text-[hsl(var(--success))]" />
              <p className="text-2xl font-semibold">{stats.words}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Words</p>
            </Card>

            <Card>
              <Languages className="mb-3 h-5 w-5 text-[hsl(var(--accent))]" />
              <p className="text-2xl font-semibold">{stats.translated}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Translations</p>
            </Card>

            <Card>
              <Clock className="mb-3 h-5 w-5 text-[hsl(var(--primary))]" />
              <p className="text-2xl font-semibold">{stats.sessionTime}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Session</p>
            </Card>
          </div>

          <Card title="Export products" subtitle="Draft captions into useful files">
            <div className="grid gap-2">
              <button
                type="button"
                onClick={exportTranscript}
                disabled={!captions.length}
                className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Export transcript
              </button>

              <button
                type="button"
                onClick={exportSrt}
                disabled={!captions.length}
                className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm disabled:opacity-50"
              >
                <Subtitles className="h-4 w-4" />
                Download subtitles
              </button>

              <button
                type="button"
                onClick={copyTranscript}
                disabled={!captions.length}
                className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy transcript
              </button>
            </div>
          </Card>

          <Card title="Needs review" subtitle={`${reviewItems.length} uncertain or suppressed captions`}>
            {reviewItems.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Questionable captions will appear here instead of quietly polluting the transcript.
              </p>
            ) : (
              <div className="space-y-3">
                {reviewItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          'rounded px-2 py-0.5 text-xs font-semibold',
                          item.status === 'suppressed'
                            ? 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]'
                            : 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]'
                        )}
                      >
                        {item.status === 'suppressed' ? 'Suppressed' : 'Review'}
                      </span>

                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {(item.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>

                    <textarea
                      value={item.draft}
                      onChange={(event) => onUpdateReview(item.id, event.target.value)}
                      className="h-20 w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                    />

                    {item.rejectionReason && (
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{item.rejectionReason}</p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onApproveReview(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--success))]/15 px-2 py-2 text-xs font-semibold text-[hsl(var(--success))]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => onDiscardReview(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--destructive))]/15 px-2 py-2 text-xs font-semibold text-[hsl(var(--destructive))]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Discard
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}
