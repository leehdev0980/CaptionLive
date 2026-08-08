import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";

import { sessions as demoSessions } from "@/lib/demo-data";
import { fetchSessions, type SessionDto } from "@/services/captionApi";

export const Route = createFileRoute("/dashboard/library")({

  head: () => ({ meta: [{ title: "Archive — LiveCaption Hub" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiSessions, setApiSessions] = useState<SessionDto[]>([]);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    fetchSessions(200, { signal: abortController.signal })
      .then((data) => {
        setApiSessions(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        console.error(e);
        setError("Failed to load archive sessions");
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, []);

  const ended = useMemo(() => {
    const base = apiSessions.length ? apiSessions : demoSessions;

    return (base as unknown as Array<SessionDto & { id: string }>).filter(
      (s) =>
        String(s.status ?? (s as any).Status ?? "").toLowerCase() === "ended",
    );
  }, [apiSessions]);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Workspace · Kifaru Labs</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Archive</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl">
          Every ended session is fully searchable. Filter by speaker, date, or keyword.
        </p>

        <div className="mt-8 flex items-center gap-2">
          <input
            placeholder="Search transcripts… try &quot;latency&quot;"
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-signal focus:ring-2 focus:ring-signal/30"
          />
          <button className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm hover:bg-surface-2">Filters</button>
        </div>

        <div className="mt-8 grid gap-3">
          {ended.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-surface/40 p-5 hover:bg-surface transition-colors">
              <div>
                <h3 className="font-medium">{s.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>{s.startedAt}</span>
                  <span>· {s.host}</span>
                  <span>· {s.wordCount.toLocaleString()} words</span>
                  <span>· {s.durationMinutes}m</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2">Export</button>
                <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-surface-2">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
