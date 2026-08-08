import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "./logo";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Sessions", icon: "◉" },
  { to: "/dashboard/library", label: "Archive", icon: "▤" },
  { to: "/dashboard/team", label: "Team", icon: "◐" },
  { to: "/dashboard/settings", label: "Settings", icon: "◇" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex flex-col border-r border-border/60 bg-surface/40 p-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display text-base font-semibold">
            LiveCaption <span className="text-signal">Hub</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1">
          {nav.map((n) => {
            const active =
              loc.pathname === n.to ||
              (n.to === "/dashboard" &&
                loc.pathname.startsWith("/dashboard") &&
                loc.pathname !== "/dashboard/library" &&
                loc.pathname !== "/dashboard/team" &&
                loc.pathname !== "/dashboard/settings");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-signal/10 text-signal"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <span className="font-mono text-xs">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal">
            <span className="h-1.5 w-1.5 rounded-full bg-signal animate-live-dot" />
            Whisper cluster online
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Median latency{" "}
            <span className="text-foreground font-mono">712 ms</span> · US-East
          </p>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
