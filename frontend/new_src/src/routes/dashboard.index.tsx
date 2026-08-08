import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { createSession, fetchSessions } from "@/services/captionApi";
import { useEffect, useMemo, useState } from "react";
import { sessions as demoSessions } from "@/lib/demo-data";

type SessionStatus = "live" | "scheduled" | "ended";

type SessionViewModel = {
  id: string;
  title: string;
  status: "live" | "scheduled" | "ended";
  startedAt: string;
  durationMinutes: number;
  participantCount: number;
  wordCount: number;
  language: string;
  host: string;
};

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — LiveCaption Hub" },
      {
        name: "description",
        content: "Manage your live and archived captioning sessions.",
      },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    fetchSessions(50, { signal: abortController.signal })
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch((e) => {
        if (e?.name === "AbortError") return;
        console.error(e);
        setError("Failed to load sessions");
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, []);

  const handleCreateSession = async () => {
    setCreateError(null);

    const title = window.prompt("Session title");
    if (!title || !title.trim()) return;

    try {
      setCreating(true);

      // Backend requires sessionId + title. Per requirement, only title is user input;
      // we generate the GUID internally.
      const newSessionId = crypto.randomUUID();

      const created = await createSession({
        sessionId: newSessionId,
        title: title.trim(),
      });

      const guid = created?.sessionId ?? created?.SessionId ?? created?.id;
      if (!guid) throw new Error("Backend did not return sessionId.");

      await navigate({
        to: "/sessions/$id",
        params: { id: String(guid) },
      });
    } catch (e) {
      console.error("Create session failed:", e);
      setCreateError("Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const normalized = useMemo(() => {
    return sessions.map((s) => {
      const statusRaw = (s.status ?? s.Status ?? "").toString().toLowerCase();
      const status: SessionStatus =
        statusRaw === "live" ||
        statusRaw === "scheduled" ||
        statusRaw === "ended"
          ? (statusRaw as SessionStatus)
          : "ended";

      return {
        id: s.sessionId ?? s.id,
        title: s.title ?? "Untitled",
        status,
        startedAt: s.startedAt ?? s.StartedAt ?? "",
        durationMinutes:
          Number(s.durationMinutes ?? s.DurationMinutes ?? 0) || 0,
        participantCount:
          Number(s.participantCount ?? s.ParticipantCount ?? 0) || 0,
        wordCount: Number(s.wordCount ?? s.WordCount ?? 0) || 0,
        language: s.language ?? "English",
        host: s.host ?? "Unknown",
      };
    });
  }, [sessions]);

  const live = normalized.filter((s) => s.status === "live");
  const scheduled = normalized.filter((s) => s.status === "scheduled");
  const ended = normalized.filter((s) => s.status === "ended");

  const endedToShow = useMemo<SessionViewModel[]>(() => {
    if (ended.length) return ended;
    return demoSessions
      .filter((s) => s.id === "s-03H")
      .map((s) => ({
        id: s.id,
        title: s.title,
        status: "ended",
        startedAt: s.startedAt,
        durationMinutes: s.durationMinutes,
        participantCount: s.participantCount,
        wordCount: s.wordCount,
        language: s.language,
        host: s.host,
      }));
  }, [ended]);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Workspace · Kifaru Labs
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              Sessions
            </h1>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreateSession()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_24px_var(--signal-glow)] disabled:opacity-60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-live-dot" />
            {creating ? "Creating…" : "New session"}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Live now" value={live.length.toString()} accent />
          <Stat label="Sessions this week" value="14" />
          <Stat label="Words captioned" value="128.4k" />
          <Stat label="Avg latency" value="712 ms" />
        </div>

        {createError && (
          <div className="mt-6 text-sm text-destructive">{createError}</div>
        )}

        {loading && (
          <div className="mt-8 text-sm text-muted-foreground">
            Loading sessions…
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && live.length > 0 && (
          <Section title="Live now">
            {live.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </Section>
        )}

        {!loading && !error && scheduled.length > 0 && (
          <Section title="Scheduled">
            {scheduled.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </Section>
        )}

        {!loading && !error && (
          <Section title="Recent">
            {endedToShow.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </Section>
        )}
      </div>
    </AppShell>
  );
}
function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? "border-signal/40 bg-signal/5" : "border-border bg-surface/60"}`}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-semibold ${accent ? "text-signal" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/40">
        {children}
      </div>
    </section>
  );
}

function SessionRow({ s }: { s: SessionViewModel }) {
  return (
    <Link
      to="/sessions/$id"
      params={{ id: s.id }}
      className="flex items-center gap-4 p-4 hover:bg-surface transition-colors"
    >
      <StatusPill status={s.status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{s.title}</h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {s.id}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{s.startedAt}</span>
          <span>· {s.host}</span>
          <span>· {s.language}</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <MetricCol label="participants" value={s.participantCount.toString()} />
        {s.status !== "scheduled" && (
          <>
            <MetricCol label="duration" value={`${s.durationMinutes}m`} />
            <MetricCol label="words" value={s.wordCount.toLocaleString()} />
          </>
        )}
      </div>
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
    </Link>
  );
}

function MetricCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-sm">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "live" | "scheduled" | "ended" }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-live/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-live">
        <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-dot" />
        Live
      </span>
    );
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-signal/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-signal">
        ◷ Soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
      Ended
    </span>
  );
}
