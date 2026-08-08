import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

import { Logo } from "@/components/logo";
import { Waveform } from "@/components/waveform";
import AudioRecorderPcm from "@/components/AudioRecorderPcm";
import {
  CAPTION_HUB_URL,
  fetchSessionCaptions,
  normalizeCaption,
  uploadAudioChunk,
} from "@/services/captionApi";
import { demoCaptions, getParticipant } from "@/lib/demo-data";

export const Route = createFileRoute("/sessions/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Session ${params.id} — LiveCaption Hub` },
      {
        name: "description",
        content: "Live collaborative captioning session.",
      },
    ],
  }),
  component: SessionPage,
});

type Caption = ReturnType<typeof normalizeCaption>;

const SESSION_TITLE = "Live Caption Session";

function speakerStyle(caption: Caption) {
  const speakerId = caption?.speakerId ? String(caption.speakerId) : "unknown";

  if (caption?.speakerColor) {
    const c = caption.speakerColor;
    return {
      backgroundColor: c,
      borderColor: c,
      color: "#06111a",
      borderWidth: 1,
      borderStyle: "solid",
    };
  }

  let hash = 0;
  for (let i = 0; i < speakerId.length; i++)
    hash = (hash * 31 + speakerId.charCodeAt(i)) >>> 0;
  const hue = hash % 360;

  return {
    backgroundColor: `hsl(${hue} 80% 55% / 0.22)`,
    borderColor: `hsl(${hue} 80% 55% / 0.55)`,
    color: `hsl(${hue} 70% 30%)`,
    borderWidth: 1,
    borderStyle: "solid",
  };
}

function initialsFromSpeakerId(speakerId: string | null | undefined) {
  const s = speakerId ? String(speakerId) : "?";
  return (
    s
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function formatClock(ts: string | null | undefined) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function safeSpeakerLabel(caption: Caption) {
  if (caption?.speakerName) return caption.speakerName;
  if (caption?.speakerId) return `Speaker ${caption.speakerId}`;
  return "Unknown";
}

export default function SessionPage() {
  const { id } = Route.useParams();
  const sessionId = id;

  const DEMO_SESSION_ID = "s-03H";

  const isDemoSession = useMemo(
    () => String(sessionId ?? "") === DEMO_SESSION_ID,
    [sessionId],
  );

  const isValidGuid = useMemo(() => {
    // UUID v1-v5, standard 8-4-4-4-12 hex with hyphens
    const s = String(sessionId ?? "");
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s,
    );
  }, [sessionId]);

  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");
  const [transcriptStatus, setTranscriptStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");

  const [captions, setCaptions] = useState<Caption[]>([]);
  const [recording, setRecording] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const confirmedCaptions = useMemo(
    () => captions.filter((c) => !c?.noAudio && c?.kind !== "partial"),
    [captions],
  );

  const partialCaptions = useMemo(
    () => captions.filter((c) => !c?.noAudio && c?.kind === "partial"),
    [captions],
  );

  // REST history (skip when id is not a GUID)
  useEffect(() => {
    if (isDemoSession) {
      setCaptions(
        demoCaptions.map((c) => ({
          captionId: null,
          sessionId: DEMO_SESSION_ID,
          timestamp: c.timestamp,
          language: "en",
          text: c.text,
          confidence: c.confidence,
          speakerId: c.speakerId,
          kind: "confirmed",
          noAudio: false,
          translationError: false,
          speakerName: getParticipant(c.speakerId)?.name ?? null,
          speakerColor: getParticipant(c.speakerId)?.color ?? null,
        })),
      );
      setTranscriptStatus("ready");
      return;
    }

    if (!isValidGuid) {
      setCaptions([]);
      setTranscriptStatus("error");
      return;
    }

    const abortController = new AbortController();
    setTranscriptStatus("loading");

    fetchSessionCaptions(sessionId, { signal: abortController.signal })
      .then((initial) => {
        setCaptions(initial);
        setTranscriptStatus("ready");
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Transcript load error:", err);
        setTranscriptStatus("error");
      });

    return () => abortController.abort();
  }, [sessionId, isValidGuid, isDemoSession]);

  // SignalR: connect + join group (skip when id is not a GUID)
  useEffect(() => {
    if (isDemoSession || !isValidGuid) {
      setConnectionStatus("disconnected");
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(CAPTION_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveCaption", (payload: unknown) => {
      const caption = normalizeCaption(payload);
      if (!caption) return;
      if (caption.sessionId && String(caption.sessionId) !== String(sessionId))
        return;

      setCaptions((prev) => {
        // Prefer stable replacement when backend provides captionId
        if (caption.captionId) {
          const idx = prev.findIndex((c) => c.captionId === caption.captionId);
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = caption;
            return next;
          }
        }
        return [...prev, caption];
      });
    });

    connection.onreconnecting(() => setConnectionStatus("reconnecting"));
    connection.onreconnected(() => setConnectionStatus("connected"));
    connection.onclose(() => setConnectionStatus("disconnected"));

    connection
      .start()
      .then(async () => {
        setConnectionStatus("connected");
        try {
          await connection.invoke("JoinSession", sessionId);
        } catch (e) {
          console.error("JoinSession failed:", e);
        }
      })
      .catch((error) => {
        console.error("SignalR error:", error);
        setConnectionStatus("disconnected");
      });

    return () => {
      void (async () => {
        try {
          await connection.invoke("LeaveSession", sessionId);
        } catch {
          // ignore
        }
        await connection.stop();
      })();
    };
  }, [sessionId, isValidGuid]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [captions.length]);

  // Audio upload loop (ported from Workstation.jsx)
  const uploadInFlightRef = useRef(false);
  const queuedChunkRef = useRef<Blob | null>(null);
  const chunkIdRef = useRef(0);

  const handleChunkReady = useCallback(
    (audioBlob: Blob) => {
      if (!audioBlob || audioBlob.size === 0) return;

      setRecording(true);

      if (uploadInFlightRef.current) {
        queuedChunkRef.current = audioBlob;
        return;
      }

      const runUploadLoop = async (firstBlob: Blob) => {
        uploadInFlightRef.current = true;

        try {
          let currentBlob: Blob | null = firstBlob;

          while (currentBlob) {
            const chunkId = ++chunkIdRef.current;
            setUploadStatus("uploading");

            await uploadAudioChunk({
              audioBlob: currentBlob,
              sessionId,
              sessionTitle: SESSION_TITLE,
              chunkId,
            });

            currentBlob = queuedChunkRef.current;
            queuedChunkRef.current = null;
          }

          setUploadStatus("idle");
        } catch (error) {
          console.error("Upload error:", error);
          setUploadStatus("error");
        } finally {
          uploadInFlightRef.current = false;
          if (queuedChunkRef.current) {
            const nextBlob = queuedChunkRef.current;
            queuedChunkRef.current = null;
            void runUploadLoop(nextBlob);
          }
        }
      };

      void runUploadLoop(audioBlob);
    },
    [sessionId],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Logo className="h-6 w-6" />
              <span className="hidden md:inline font-display text-sm">
                Dashboard
              </span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{`Session ${sessionId}`}</span>
                {recording && (
                  <span className="inline-flex items-center gap-1.5 rounded bg-live/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-live">
                    <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-dot" />
                    Rec
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {sessionId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 mr-2 font-mono text-xs text-muted-foreground">
              <span>{formatClock(new Date().toISOString())}</span>
              <span className="text-signal">●</span>
              <span>{captions.length} lines</span>
            </div>
            <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
              Share
            </button>
            <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-surface-2">
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-[1fr_320px] min-h-0">
        <div className="flex flex-col min-h-0 border-r border-border/60">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 md:px-10 py-8 space-y-6"
          >
            {!isValidGuid && !isDemoSession ? (
              <div className="text-muted-foreground text-sm">
                Invalid session id. Please navigate using a GUID session link.
              </div>
            ) : confirmedCaptions.length || partialCaptions.length ? (
              <>
                {confirmedCaptions.map((c) => {
                  const style = speakerStyle(c);
                  return (
                    <div
                      key={c.captionId ?? `${c.timestamp}-${c.text}`}
                      className="animate-caption-in"
                    >
                      <div className="flex items-baseline gap-3">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={style}
                        >
                          {initialsFromSpeakerId(c.speakerId)}
                        </div>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: style.color as string }}
                        >
                          {safeSpeakerLabel(c)}
                        </span>

                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatClock(c.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1.5 pl-9 text-base md:text-lg leading-relaxed text-foreground/95">
                        {c.noAudio ? "No Audio" : c.text}
                        {c ===
                          confirmedCaptions[confirmedCaptions.length - 1] &&
                          recording && (
                            <span className="ml-1 inline-block h-4 w-[2px] translate-y-0.5 bg-signal animate-live-dot" />
                          )}
                      </p>
                    </div>
                  );
                })}

                {partialCaptions.length ? (
                  <div className="space-y-4">
                    {partialCaptions.slice(-5).map((c, i) => {
                      const style = speakerStyle(c);
                      return (
                        <div
                          key={c.captionId ?? `${c.timestamp}-${i}`}
                          className="animate-caption-in opacity-80"
                        >
                          <div className="flex items-baseline gap-3">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                              style={style}
                            >
                              {initialsFromSpeakerId(c.speakerId)}
                            </div>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: style.color as string }}
                            >
                              {safeSpeakerLabel(c)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {formatClock(c.timestamp)}
                            </span>
                          </div>
                          <p className="mt-1.5 pl-9 text-base md:text-lg leading-relaxed text-foreground/95">
                            {c.noAudio ? "No Audio" : c.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-muted-foreground text-sm">
                {transcriptStatus === "loading"
                  ? "Loading transcript..."
                  : "No captions yet."}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-surface/60 px-4 md:px-10 py-4 backdrop-blur">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRecording((r) => !r)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  recording
                    ? "bg-live text-destructive-foreground hover:bg-live/90"
                    : "bg-primary text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)]"
                }`}
              >
                {recording ? (
                  <>
                    <span className="h-2 w-2 rounded-sm bg-current" /> Stop
                    recording
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-current" /> Start
                    recording
                  </>
                )}
              </button>

              <div className="flex-1 h-10">
                <Waveform bars={64} active={recording} className="h-full" />
              </div>

              <div className="hidden md:block font-mono text-xs text-muted-foreground">
                {connectionStatus === "connected"
                  ? "Listening"
                  : connectionStatus === "reconnecting"
                    ? "Reconnecting"
                    : "Connecting"}{" "}
                ·{" "}
                {uploadStatus === "uploading"
                  ? "Uploading..."
                  : uploadStatus === "error"
                    ? "Upload error"
                    : "Idle"}
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden md:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Session
            </h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">SignalR</dt>
                <dd className="font-mono text-xs text-foreground/90">
                  {connectionStatus}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Transcript</dt>
                <dd className="font-mono text-xs text-foreground/90">
                  {transcriptStatus}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Upload</dt>
                <dd className="font-mono text-xs text-foreground/90">
                  {uploadStatus}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Capture
            </h3>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-3">
                Microphone
              </div>
              <AudioRecorderPcm
                onChunkReady={(blob: Blob) => {
                  if (!recording) return;
                  handleChunkReady(blob);
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
