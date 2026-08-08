import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { fetchSessions } from "@/services/captionApi";
import { useEffect, useMemo, useState } from "react";

type MemberRow = {
  id: string;
  name: string;
  initials: string;
  role: "host" | "speaker" | "listener";
  color: string;
  sessionsHosted: number;
};

export const Route = createFileRoute("/dashboard/team")({
  head: () => ({ meta: [{ title: "Team — LiveCaption Hub" }] }),
  component: TeamPage,
});

function TeamPage() {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);

    fetchSessions(200, { signal: abortController.signal })
      .then((data) => {
        const sessions = Array.isArray(data) ? data : [];
        const byHost = new Map<
          string,
          { name: string; sessionsHosted: number }
        >();

        for (const raw of sessions as unknown[]) {
          const r = raw as Record<string, unknown>;
          const host = (r.host ?? r.Host) as unknown;
          const hostName = String(host ?? "").trim();
          if (!hostName) continue;

          const entry = byHost.get(hostName) ?? {
            name: hostName,
            sessionsHosted: 0,
          };
          entry.sessionsHosted += 1;
          byHost.set(hostName, entry);
        }

        const palette = [
          "oklch(0.82 0.22 152)",
          "oklch(0.72 0.18 260)",
          "oklch(0.75 0.2 30)",
          "oklch(0.7 0.18 320)",
          "oklch(0.78 0.16 190)",
        ];

        const normalized: MemberRow[] = Array.from(byHost.entries()).map(
          ([name, meta], idx) => {
            const parts = name.split(" ").filter(Boolean);
            const initials = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
            return {
              id: name,
              name,
              initials: initials.toUpperCase(),
              role: "host",
              color: palette[idx % palette.length],
              sessionsHosted: meta.sessionsHosted,
            };
          },
        );

        // Most hosted first
        normalized.sort((a, b) => b.sessionsHosted - a.sessionsHosted);
        setRows(normalized);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, []);

  const displayRows = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              Team
            </h1>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)]">
            Invite member
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface/60 text-left">
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Sessions hosted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayRows.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${p.color.replace(
                              ")",
                              " / 0.15)",
                            )}`,
                            color: p.color,
                          }}
                        >
                          {p.initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.name.split(" ")[0].toLowerCase()}@kifaru.co
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{p.role}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {p.sessionsHosted}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
                {displayRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      No session hosts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
