import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

import { Logo } from "@/components/logo";
import {
  demoCaptions,
  getParticipant,
  getSession,
  participants,
  upcomingLine,
  type CaptionLine,
} from "@/lib/demo-data";
import {
  CAPTION_HUB_URL,
  fetchSessionCaptions,
  normalizeCaption,
} from "@/services/captionApi";
import type { Caption } from "@/services/types";

export const Route = createFileRoute("/join/$id")({
  head: ({ params })  => ({
    meta: [
      { title: `Joining ${params.id} — LiveCaption Hub` },
      { name: "description", content: "Follow along with the live transcript." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinSessionPage,
});

type Reaction = { id: string; emoji: string; ts: number };
type Question = {
  id: string;
  author: string;
  text: string;
  upvotes: number;
  mine?: boolean;
};

const EMOJIS = ["👍", "🎯", "🤔", "❤️", "👏", "🔥"];

function JoinSessionPage() {
  const { id } = Route.useParams();

  const search =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const displayName = search?.get("name") || "Guest";
  const lang = search?.get("lang") || "en";

  const session = getSession(id) ?? {
    id,
    title: "Live session",
    status: "live" as const,
    startedAt: "Just now",
    durationMinutes: 0,
    participantCount: participants.length,
    wordCount: 0,
    language: "English",
    host: "Host",
  };

  const [captions, setCaptions] = useState<CaptionLine[]>(demoCaptions);

  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");

  const [transcriptStatus, setTranscriptStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");

  const [follow, setFollow] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [highContrast, setHighContrast] = useState(false);

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [elapsed, setElapsed] = useState(session.durationMinutes * 60 + 12);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Ticking clock
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const isValidSessionId = useMemo(() => {
    const s = String(id ?? "");
    // UUID v1-v5, standard 8-4-4-4-12 hex with hyphens
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      s,
    );
  }, [id]);

  // Real transcript history + live captions (SignalR) — demo simulation stays as fallback.
  useEffect(() => {
    if (!isValidSessionId) {
      setTranscriptStatus("error");
      return;
    }

    const abortController = new AbortController();
    setTranscriptStatus("loading");

    fetchSessionCaptions(String(id), { signal: abortController.signal })
      .then((initial) => {
        const mapped: CaptionLine[] = initial.map((c: any) => ({
          captionId: c.captionId ?? null,
          sessionId: c.sessionId ?? String(id),
          timestamp: c.timestamp,
          language: c.language ?? "en",
          text: c.text,
          confidence: typeof c.confidence === "number" ? c.confidence : 0.9,
          speakerId: c.speakerId ?? "u1",
          kind: c.kind ?? "confirmed",
          noAudio: Boolean(c.noAudio),
          translationError: Boolean(c.translationError),
          speakerName: c.speakerName ?? null,
          speakerColor: c.speakerColor ?? null,
          // demo UI expects id/speakerId/text/timestamp/confidence/conf
          // captionApi normalizeCaption does not provide these demo keys; adapt below
          id: c.captionId ? String(c.captionId) : `${c.timestamp}-${c.text}`,
        } as any));
        setCaptions(mapped.length ? mapped : demoCaptions);
        setTranscriptStatus("ready");
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        console.error("fetchSessionCaptions failed", e);
        setTranscriptStatus("error");
      });

    return () => abortController.abort();
  }, [id, isValidSessionId]);

  // Simulated live caption stream (read-only for joiner)
  // Only run the simulation when we are disconnected or invalid id.
  useEffect(() => {
    if (isValidSessionId && (transcriptStatus === "ready" || connectionStatus !== "disconnected")) {
      return;
    }

    const words = upcomingLine.split(" ");
    let idx = 0;
    let currentId = `c-${Date.now()}`;
    let building = "";

    const iv = setInterval(() => {
      if (idx >= words.length) {
        const pick = demoCaptions[Math.floor(Math.random() * demoCaptions.length)];
        currentId = `c-${Date.now()}-${Math.random()}`;
        building = pick.text;
        setCaptions((prev) => [
          ...prev,
          {
            id: currentId,
            speakerId: pick.speakerId,
            text: building,
            timestamp: formatTime(elapsedRef.current),
            confidence: 0.9 + Math.random() * 0.08,
          },
        ]);
        idx = words.length + 1;
        return;
      }
      building = words.slice(0, idx + 1).join(" ");
      if (idx === 0) {
        setCaptions((prev) => [
          ...prev,
          {
            id: currentId,
            speakerId: "u1",
            text: building,
            timestamp: formatTime(elapsedRef.current),
            confidence: 0.95,
          },
        ]);
      } else {
        setCaptions((prev) => prev.map((c) => (c.id === currentId ? { ...c, text: building } : c)));
      }
      idx++;
    }, 420);
    return () => clearInterval(iv);
  }, [connectionStatus, isValidSessionId, transcriptStatus]);

  // SignalR: connect + join group (skip when id is not a valid session id)
  useEffect(() => {
    if (!isValidSessionId) {
      setConnectionStatus("disconnected");
      return;
    }

    const sessionId = String(id);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(CAPTION_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveCaption", (payload: unknown) => {
      const caption = normalizeCaption(payload) as CaptionLike | null;

      if (!caption) return;
      if (caption.sessionId && String(caption.sessionId) !== sessionId) return;

      setCaptions((prev) => {
        const key = caption.captionId ? String(caption.captionId) : null;
        const mapped: CaptionLine = {
          id: key ?? `${caption.timestamp}-${caption.text}`,
          speakerId: caption.speakerId ?? "u1",
          text: caption.text,
          timestamp: caption.timestamp,
          confidence: typeof caption.confidence === "number" ? caption.confidence : 0.9,
        } as any;

        if (key) {
          const idx = prev.findIndex((c: any) => String((c as any).captionId ?? c.id) === key);
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = mapped;
            return next;
          }
        }
        return [...prev, mapped];
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
          console.error("JoinSession failed", e);
        }
      })
      .catch((e) => {
        console.error("SignalR start failed", e);
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
  }, [id, isValidSessionId]);

  const elapsedRef = useRef(elapsed);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // Autoscroll when following
  useEffect(() => {
    if (!follow) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [captions.length, follow]);

  // Detect scroll away → pause follow
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (!nearBottom && follow) setFollow(false);
  }

  function react(emoji: string) {
    const r: Reaction = { id: `${Date.now()}-${Math.random()}`, emoji, ts: Date.now() };
    setReactions((prev) => [...prev, r]);
    setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== r.id)), 2600);
  }

  function toggleBookmark(cid: string) {
    setBookmarks((prev) => {
      const n = new Set(prev);
      n.has(cid) ? n.delete(cid) : n.add(cid);
      return n;
    });
  }

  function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!qInput.trim()) return;
    setQuestions((prev) => [
      { id: `q-${Date.now()}`, author: displayName, text: qInput.trim(), upvotes: 1, mine: true },
      ...prev,
    ]);
    setQInput("");
    setTab("questions");
  }

  function upvote(qid: string) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  }

  const fontClass = useMemo(() => ({
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  }[fontSize]), [fontSize]);

  const contrastClass = highContrast ? "bg-black text-white" : "text-foreground/95";

  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/join" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Logo className="h-6 w-6" />
              <span className="hidden md:inline font-display text-sm">Leave</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{session.title}</span>
                <span className="inline-flex items-center gap-1.5 rounded bg-live/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-dot" />
                  Live
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {session.id} · Hosted by {session.host} · {formatTime(elapsed)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex -space-x-2 mr-1">
              {participants.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  title={p.name}
                  className="h-7 w-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-semibold"
                  style={{ backgroundColor: `${p.color.replace(")", " / 0.2)")}`, color: p.color }}
                >
                  {p.initials}
                </div>
              ))}
              <div className="h-7 w-7 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                +{Math.max(0, participants.length - 4)}
              </div>
            </div>
            <div
              className="flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 pl-1 pr-3 py-1"
              title={`You joined as ${displayName}`}
            >
              <div className="h-6 w-6 rounded-full bg-signal text-primary-foreground flex items-center justify-center text-[10px] font-semibold">
                {initials}
              </div>
              <span className="text-xs font-medium">{displayName}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-signal">listener</span>
            </div>
          </div>
        </div>

        {/* Sub-toolbar */}
        <div className="border-t border-border/40 px-4 md:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {(["transcript", "questions", "people"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  tab === t ? "bg-signal/15 text-signal" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {t === "questions" && questions.length > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] opacity-70">{questions.length}</span>
                )}
                {t === "people" && (
                  <span className="ml-1.5 font-mono text-[10px] opacity-70">{participants.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 border border-border rounded-md p-0.5">
              {(["sm", "md", "lg", "xl"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`px-2 py-1 rounded text-[10px] font-mono uppercase ${
                    fontSize === s ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  A{s === "sm" ? "" : s === "md" ? "+" : s === "lg" ? "++" : "+++"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHighContrast((v) => !v)}
              className={`px-2.5 py-1.5 rounded-md border text-[10px] font-mono uppercase tracking-wider ${
                highContrast ? "border-signal text-signal bg-signal/10" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Contrast
            </button>
            <select
              defaultValue={lang}
              className="hidden md:block h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid md:grid-cols-[1fr_340px] min-h-0 relative">
        {/* Transcript / questions / people */}
        <div className="relative flex flex-col min-h-0 md:border-r border-border/60">
          {tab === "transcript" && (
            <>
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className={`flex-1 overflow-y-auto px-4 md:px-10 py-8 space-y-6 ${contrastClass}`}
              >
                {captions.map((c, i) => {
                  const p = getParticipant(c.speakerId);
                  const isLast = i === captions.length - 1;
                  const marked = bookmarks.has(c.id);
                  return (
                    <div key={c.id} className="group animate-caption-in">
                      <div className="flex items-baseline gap-3">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: `${p.color.replace(")", " / 0.15)")}`, color: p.color }}
                        >
                          {p.initials}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: highContrast ? "#fff" : p.color }}>
                          {p.name}
                        </span>
                        <span className={`font-mono text-[10px] ${highContrast ? "text-white/60" : "text-muted-foreground"}`}>
                          {c.timestamp} · {(c.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => toggleBookmark(c.id)}
                          className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono ${
                            marked ? "text-signal opacity-100" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {marked ? "★ saved" : "☆ save"}
                        </button>
                      </div>
                      <p className={`mt-1.5 pl-9 leading-relaxed ${fontClass} ${marked ? "border-l-2 border-signal/60 -ml-[2px]" : ""}`}>
                        {c.text}
                        {isLast && (
                          <span className="ml-1 inline-block h-4 w-[2px] translate-y-0.5 bg-signal animate-live-dot" />
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Floating reactions */}
              <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 h-40 w-40">
                {reactions.map((r) => (
                  <span
                    key={r.id}
                    className="absolute left-1/2 bottom-0 text-3xl"
                    style={{
                      animation: "reactionFloat 2.6s ease-out forwards",
                      transform: `translateX(${(Math.random() - 0.5) * 120}px)`,
                    }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>

              {/* Resume-follow pill */}
              {!follow && (
                <button
                  onClick={() => setFollow(true)}
                  className="absolute bottom-32 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_24px_var(--signal-glow)]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-live-dot" />
                  Jump to live
                </button>
              )}

              {/* Bottom bar */}
              <div className="border-t border-border bg-surface/70 px-4 md:px-8 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => react(e)}
                        className="h-9 w-9 rounded-md hover:bg-surface-2 text-lg transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={submitQuestion} className="flex-1 max-w-xl flex items-center gap-2">
                    <input
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      placeholder="Ask a question for the host…"
                      className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-signal transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!qInput.trim()}
                      className="rounded-md bg-primary px-4 h-10 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:shadow-[0_0_18px_var(--signal-glow)] transition-all"
                    >
                      Ask
                    </button>
                  </form>

                  <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal animate-live-dot" />
                    receiving · {captions.length} lines
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "questions" && (
            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-xl font-semibold">Questions for the host</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upvote what matters — the host sees the top questions first.
                </p>

                <form onSubmit={submitQuestion} className="mt-6 flex gap-2">
                  <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Type your question…"
                    className="flex-1 h-11 rounded-md border border-border bg-surface/60 px-3 text-sm focus:outline-none focus:border-signal"
                  />
                  <button
                    type="submit"
                    disabled={!qInput.trim()}
                    className="rounded-md bg-primary px-5 h-11 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    Post
                  </button>
                </form>

                <ul className="mt-6 space-y-3">
                  {[...questions].sort((a, b) => b.upvotes - a.upvotes).map((q) => (
                    <li
                      key={q.id}
                      className={`flex gap-3 rounded-xl border p-4 ${
                        q.mine ? "border-signal/40 bg-signal/5" : "border-border bg-surface/40"
                      }`}
                    >
                      <button
                        onClick={() => upvote(q.id)}
                        className="flex flex-col items-center justify-center min-w-12 rounded-md border border-border bg-background hover:border-signal/50 px-2 py-1 transition-colors"
                      >
                        <span className="text-xs">▲</span>
                        <span className="font-mono text-sm font-semibold">{q.upvotes}</span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{q.author}</span>
                          {q.mine && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-signal">You</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-foreground/90">{q.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "people" && (
            <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-display text-xl font-semibold">In the room</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {participants.length + 1} people are following this session.
                </p>
                <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface/40">
                  <li className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 rounded-full bg-signal text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{displayName} <span className="text-signal text-[10px] font-mono uppercase ml-1">You</span></div>
                      <div className="font-mono text-[10px] uppercase text-muted-foreground">listener · joined {formatTime(elapsed)}</div>
                    </div>
                  </li>
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-4">
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ backgroundColor: `${p.color.replace(")", " / 0.15)")}`, color: p.color }}
                      >
                        {p.initials}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="font-mono text-[10px] uppercase text-muted-foreground">{p.role}</div>
                      </div>
                      {p.role !== "listener" && <span className="text-signal text-xs">◉ speaking</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Now speaking
            </h3>
            <NowSpeaking captions={captions} />
          </div>

          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Saved lines
              </h3>
              <span className="font-mono text-[10px] text-signal">{bookmarks.size}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {[...bookmarks].length === 0 && (
                <li className="text-xs text-muted-foreground">
                  Hover any line and tap ☆ to save it. Bookmarks travel with the transcript export.
                </li>
              )}
              {captions
                .filter((c) => bookmarks.has(c.id))
                .slice(-4)
                .map((c) => {
                  const p = getParticipant(c.speakerId);
                  return (
                    <li key={c.id} className="rounded-md border border-border/60 bg-background/40 p-2.5">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {c.timestamp} · {p.name}
                      </div>
                      <p className="mt-1 text-xs line-clamp-2">{c.text}</p>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="p-6 border-b border-border">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Session
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Host" v={session.host} />
              <Row k="Started" v={session.startedAt} />
              <Row k="Source" v={session.language} />
              <Row k="Your view" v={lang.toUpperCase()} />
              <Row k="Latency" v="712 ms" />
            </dl>
          </div>

          <div className="p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Shortcuts
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <Kbd k="F" v="Toggle follow" />
              <Kbd k="B" v="Bookmark line" />
              <Kbd k="+ / -" v="Caption size" />
              <Kbd k="?" v="All shortcuts" />
            </ul>
          </div>
        </aside>
      </div>

      {/* Local keyframes */}
      <style>{`
        @keyframes reactionFloat {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translate(-50%, -20px) scale(1); }
          100% { transform: translate(-50%, -220px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function NowSpeaking({ captions }: { captions: CaptionLine[] }) {
  const last = captions[captions.length - 1];
  if (!last) return null;
  const p = getParticipant(last.speakerId);
  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="relative">
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: `${p.color.replace(")", " / 0.2)")}`, color: p.color }}
        >
          {p.initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-signal border-2 border-background animate-live-dot" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{p.name}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-signal">
          Speaking · {(last.confidence * 100).toFixed(0)}% clear
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono text-xs text-foreground/90">{v}</dd>
    </div>
  );
}

function Kbd({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>{v}</span>
      <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
        {k}
      </kbd>
    </li>
  );
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
