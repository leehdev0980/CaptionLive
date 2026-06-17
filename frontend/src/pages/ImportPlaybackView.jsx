import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Play, RotateCcw } from 'lucide-react';

import Card from '../components/Card';
import CinematicCaptionDisplay from '../components/CinematicCaptionDisplay';

const SUPPORTED_MEDIA_EXTENSIONS = ['.wav', '.mp3', '.webm', '.mp4', '.m4a', '.ogg'];

function isSupportedFile(file) {
  const lowerName = (file?.name || '').toLowerCase();
  return SUPPORTED_MEDIA_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getCaptionSeconds(caption, fallbackIndex = 0) {
  // Prefer explicit seconds fields when present.
  // The app currently stores `sessionSeconds` on entries.
  if (caption?.timestampSeconds != null) return safeNumber(caption.timestampSeconds, fallbackIndex);
  if (caption?.sessionSeconds != null) return safeNumber(caption.sessionSeconds, fallbackIndex);
  if (caption?.segments?.[0]?.start != null) return safeNumber(caption.segments[0].start, fallbackIndex);
  return fallbackIndex;
}

export default function ImportPlaybackView({
  sessionTitle,
  importState,
  captions = [],
  // latestCaption is intentionally unused here; kept for API compatibility
  latestCaption: _latestCaption,

  translateEnabled,
  onBackToLanding,
  // Keep these compatible with the existing flows in App.jsx:
  onUploadFile,
  onUploadUrl,
  onRetryImport,
  // Optional: if App provides a finalized uploaded URL for playback
  playbackUrl,
  // Two import modes are already modeled in App.jsx; this view preserves them.
  defaultMode = 'file' // 'file' | 'url'
}) {
  const videoRef = useRef(null);

  const [mode, setMode] = useState(defaultMode === 'url' ? 'url' : 'file');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [urlValue, setUrlValue] = useState('');

  const [videoTime, setVideoTime] = useState(0);

  // Drive timelapse captions using video currentTime.

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let raf = 0;
    const onTick = () => {
      setVideoTime(v.currentTime || 0);
      raf = window.requestAnimationFrame(onTick);
    };

    raf = window.requestAnimationFrame(onTick);
    return () => window.cancelAnimationFrame(raf);
  }, [playbackUrl]);

  const captionsWithSeconds = useMemo(() => {
    return captions.map((c, idx) => {
      const seconds = getCaptionSeconds(c, idx * 3);
      return { ...c, __t: seconds };
    });
  }, [captions]);

  // Show captions that are within a rolling window around current time.
  // “Pop-down” feel: include the closest segment and a small trailing window.
  const visibleCaptions = useMemo(() => {
    if (!captionsWithSeconds.length) return [];

    const windowStart = Math.max(0, videoTime - 2.5);
    const windowEnd = videoTime + 0.6;

    const inWindow = captionsWithSeconds.filter((c) => c.__t >= windowStart && c.__t <= windowEnd);

    // If nothing is in the window, show closest caption.
    if (!inWindow.length) {
      let best = captionsWithSeconds[0];
      let bestDist = Math.abs(captionsWithSeconds[0].__t - videoTime);
      for (const c of captionsWithSeconds) {
        const dist = Math.abs(c.__t - videoTime);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      return best ? [best] : [];
    }

    return inWindow.sort((a, b) => a.__t - b.__t);
  }, [captionsWithSeconds, videoTime]);

  const latestVisible = visibleCaptions.length ? visibleCaptions[visibleCaptions.length - 1] : null;

  const hasImported = importState?.status === 'complete' || !!playbackUrl;

  const handleFileChosen = useCallback(
    (file) => {
      if (!file) return;
      if (!isSupportedFile(file)) return;

      setSelectedFileName(file.name);
      onUploadFile?.(file);
    },
    [onUploadFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileChosen(file);
    },
    [handleFileChosen]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleSubmitUrl = useCallback(() => {
    if (!urlValue.trim()) return;
    onUploadUrl?.(urlValue.trim());
  }, [onUploadUrl, urlValue]);

  const controls = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) v.play();
            else v.pause();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Playback
        </button>

        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            v.currentTime = 0;
            v.pause();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
        {videoTime.toFixed(2)}s
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 py-6 text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            Back to landing
          </button>

          <div className="text-right">
            <h1 className="text-base font-semibold">{sessionTitle}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Import playback + caption timelapse
            </p>
          </div>
        </div>

        {!hasImported ? (
          <Card
            title="Import media"
            subtitle="Drag & drop a supported file, or provide a direct media URL. Captions will appear after import."
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={
                  mode === 'file'
                    ? 'rounded-md bg-[hsl(var(--primary))]/15 px-3 py-2 text-sm font-semibold text-[hsl(var(--primary))]'
                    : 'rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]'
                }
              >
                File upload
              </button>
              <button
                type="button"
                onClick={() => setMode('url')}
                className={
                  mode === 'url'
                    ? 'rounded-md bg-[hsl(var(--primary))]/15 px-3 py-2 text-sm font-semibold text-[hsl(var(--primary))]'
                    : 'rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))]'
                }
              >
                Direct URL
              </button>
            </div>

            <div
              onDrop={mode === 'file' ? handleDrop : undefined}
              onDragOver={mode === 'file' ? onDragOver : undefined}
              onDragLeave={mode === 'file' ? onDragLeave : undefined}
              className={
                mode === 'file'
                  ? `rounded-2xl border-2 p-6 transition-colors ${
                      dragActive
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--background))]'
                    }`
                  : 'rounded-2xl border border-[hsl(var(--border))] p-6 bg-[hsl(var(--background))]'
              }
            >
              {mode === 'file' ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Drag & drop video/audio</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Supported: .wav, .mp3, .webm, .mp4, .m4a, .ogg
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90">
                      <Upload className="h-4 w-4" />
                      Choose file
                      <input
                        type="file"
                        accept={SUPPORTED_MEDIA_EXTENSIONS.join(',')}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChosen(file);
                        }}
                      />
                    </label>
                  </div>

                  {selectedFileName && (
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      Selected: <span className="font-mono">{selectedFileName}</span>
                    </div>
                  )}

                  {importState?.status === 'processing' && (
                    <div className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                      {importState.detail || 'Processing...'}
                    </div>
                  )}

                  {importState?.status === 'error' && (
                    <div className="mt-2 rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-sm text-[hsl(var(--destructive))]">
                      {importState.detail || 'Import failed.'}
                      {onRetryImport && (
                        <button
                          type="button"
                          onClick={onRetryImport}
                          className="ml-3 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Import from URL</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      placeholder="https://.../file.mp4"
                      className="h-10 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
                      disabled={!urlValue.trim()}
                    >
                      <Upload className="h-4 w-4" />
                      Import
                    </button>
                  </div>

                  {importState?.status === 'processing' && (
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      {importState.detail || 'Processing...'}
                    </div>
                  )}

                  {importState?.status === 'error' && (
                    <div className="rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-sm text-[hsl(var(--destructive))]">
                      {importState.detail || 'Import failed.'}
                      {onRetryImport && (
                        <button
                          type="button"
                          onClick={onRetryImport}
                          className="ml-3 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card title="Player" subtitle="Captions update as the media plays.">
              {controls}

              <div className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden">
                {playbackUrl ? (
                  <video
                    ref={videoRef}
                    controls
                    preload="metadata"
                    className="w-full max-h-[540px] bg-black"
                    src={playbackUrl}
                  />
                ) : (
                  <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No playback URL available for this import yet.
                  </div>
                )}
              </div>
            </Card>

            <Card title="Captions (timelapse)" subtitle="A rolling window of captions based on current playback time.">
              <div className="space-y-3">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Current caption
                    </div>
                    <div className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                      {latestVisible?.__t != null ? latestVisible.__t.toFixed(2) : '—'}s
                    </div>
                  </div>

                  {latestVisible ? (
                    <div className="space-y-2">
                      <div className="text-xl font-semibold leading-relaxed">{latestVisible.english}</div>
                      {translateEnabled && latestVisible.swahili && (
                        <div className="text-lg text-[hsl(var(--primary))] italic leading-relaxed">
                          {latestVisible.swahili}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">No caption at this time.</div>
                  )}
                </div>

                <div className="grid gap-2">
                  {visibleCaptions.map((c, i) => (
                    <div
                      key={`${c.id || i}-${c.__t}`}
                      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                          {c.__t.toFixed(2)}s
                        </div>
                        {c.status === 'review' && (
                          <div className="text-[10px] font-semibold rounded bg-[hsl(var(--warning))]/15 px-2 py-1 text-[hsl(var(--warning))]">
                            Needs review
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold">{c.english}</div>
                      {translateEnabled && c.swahili && (
                        <div className="text-sm text-[hsl(var(--primary))] italic">{c.swahili}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Fullscreen caption overlay" subtitle="For broadcast/presentation use.">
              <CinematicCaptionDisplay
                primaryText={latestVisible?.english || ''}
                translatedText={latestVisible?.swahili || ''}
                isRecording={false}
                translateEnabled={translateEnabled}
                confidence={latestVisible?.confidence ?? 0.95}
                latency={0}
                speakerName="Imported playback"
                timestamp={latestVisible?.timestamp || ''}
                onToggleRecording={undefined}
                onToggleTranslate={undefined}
              />
            </Card>
          </div>
        )}

        {/* Minimal metadata debug */}
        {importState?.status === 'processing' && (
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Import: {importState.label} • {importState.progress}%
          </div>
        )}
      </div>
    </main>
  );
}
