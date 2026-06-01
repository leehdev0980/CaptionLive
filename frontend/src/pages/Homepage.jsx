import { useRef } from 'react';
import { Mic, FileAudio, Globe2, Subtitles, Sparkles, XCircle, Send } from 'lucide-react';

import Card from '../components/Card';
import StatusPill from '../components/StatusPill';

export default function Homepage({
  sessionPrompt,
  onPromptChange,
  mediaUrl,
  onMediaUrlChange,
  onStartRecording,
  onFileSelected,
  onUrlImport,
  fileError,
  urlError
}) {
  const fileInputRef = useRef(null);

  return (
    <main className="min-h-screen overflow-y-auto bg-[hsl(var(--background))] px-4 py-8 text-[hsl(var(--foreground))]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="min-h-[420px]" padding={false}>
            <div className="flex h-full flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                      <Subtitles className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold">CaptionLive</h1>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Capture, translate, and refine captions</p>
                    </div>
                  </div>
                  <StatusPill icon={Sparkles} label="Ready" tone="primary" />
                </div>

                <label className="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]" htmlFor="sessionPrompt">
                  What are we captioning today?
                </label>

                <div className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--border-bright))] bg-[hsl(var(--background))] p-3 sm:flex-row">
                  <input
                    id="sessionPrompt"
                    value={sessionPrompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                    placeholder="Example: Final project demo, lecture recording, interview notes"
                    className="min-h-11 flex-1 rounded-md border border-transparent bg-[hsl(var(--muted))] px-3 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]"
                  />
                  <button
                    type="button"
                    onClick={onStartRecording}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={onStartRecording}
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-4 text-left transition hover:border-[hsl(var(--primary))]/50"
                >
                  <Mic className="mb-3 h-5 w-5 text-[hsl(var(--primary))]" />
                  <p className="text-sm font-semibold">Live microphone</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Start a real-time captioning session.</p>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-4 text-left transition hover:border-[hsl(var(--primary))]/50"
                >
                  <FileAudio className="mb-3 h-5 w-5 text-[hsl(var(--accent))]" />
                  <p className="text-sm font-semibold">Choose from device or cloud folder</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Open the file explorer for local, OneDrive, or synced Drive files.
                  </p>
                </button>

                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60 p-4">
                  <Globe2 className="mb-3 h-5 w-5 text-[hsl(var(--success))]" />
                  <p className="text-sm font-semibold">Import direct URL</p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Use a direct media link.</p>
                </div>
              </div>

              {fileError && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-xs text-[hsl(var(--destructive))]">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {fileError}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onFileSelected(file);
                  event.target.value = '';
                }}
              />
            </div>
          </Card>

          <Card title="Direct media URL" subtitle="Supports .wav, .mp3, .webm, .mp4, .m4a, and .ogg">
            <div className="space-y-3">
              <textarea
                value={mediaUrl}
                onChange={(event) => onMediaUrlChange(event.target.value)}
                placeholder="https://example.com/session-audio.mp3"
                className="h-28 w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))]"
              />
              {urlError && (
                <div className="flex items-start gap-2 rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-xs text-[hsl(var(--destructive))]">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {urlError}
                </div>
              )}

              <button
                type="button"
                onClick={onUrlImport}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(var(--success))] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                Import URL
              </button>
            </div>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <StatusPill icon={Subtitles} label="Transcript ready" tone="good" />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Every caption is saved into history for review and export.</p>
          </Card>

          <Card>
            <StatusPill icon={Globe2} label="English to Kiswahili" tone="primary" />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Translation can be enabled before recording or importing media.</p>
          </Card>

          <Card>
            <StatusPill icon={Sparkles} label="Bonus analytics" tone="warn" />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Track captions, words, session time, and exportable output.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
