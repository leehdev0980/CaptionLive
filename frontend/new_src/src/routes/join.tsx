import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { sessions } from "@/lib/demo-data";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a session — LiveCaption Hub" },
      { name: "description", content: "Enter a session code to join a live captioned conversation." },
      { property: "og:title", content: "Join a live captioned session" },
      { property: "og:description", content: "Follow along in real time. No install." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [lang, setLang] = useState("en");
  const [err, setErr] = useState<string | null>(null);

  const live = sessions.filter((s) => s.status === "live" || s.status === "scheduled");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = code.trim();
    if (!id) return setErr("Enter a session code.");
    if (!name.trim()) return setErr("Enter a display name.");
    const qs = new URLSearchParams({ name: name.trim(), lang }).toString();
    nav({ to: `/join/${encodeURIComponent(id)}?${qs}` as any });
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-noise opacity-40" />
      <div className="absolute inset-x-0 top-0 h-[420px]" style={{ background: "var(--gradient-radial-glow)" }} />

      <header className="relative z-10 px-6 md:px-10 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display text-base font-semibold">
            LiveCaption <span className="text-signal">Hub</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 container-page grid md:grid-cols-[1.1fr_0.9fr] gap-10 pt-8 md:pt-16">
        {/* Left: join card */}
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal animate-live-dot mr-2 translate-y-[-1px]" />
            Join a live session
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
            Enter the room.<br />
            <span className="text-gradient">Read every word.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            No downloads, no accounts. Type the six-character code from your host and you'll see the transcript stream live.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5 max-w-lg">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Session code
              </label>
              <div className="mt-2 relative">
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => { setErr(null); setCode(e.target.value.toUpperCase().replace(/\s/g, "")); }}
                  placeholder="S-01H"
                  maxLength={12}
                  className="w-full h-16 rounded-xl border border-border bg-surface/60 px-5 font-mono text-2xl md:text-3xl tracking-[0.35em] uppercase placeholder:text-muted-foreground/40 focus:outline-none focus:border-signal focus:shadow-[0_0_0_4px_var(--ring)] transition-all"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {code.length ? `${code.length} ch` : ""}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_180px] gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(e) => { setErr(null); setName(e.target.value); }}
                  placeholder="e.g. Wanjiku K."
                  className="mt-2 w-full h-11 rounded-md border border-border bg-surface/60 px-3 text-sm focus:outline-none focus:border-signal transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Caption language
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="mt-2 w-full h-11 rounded-md border border-border bg-surface/60 px-3 text-sm focus:outline-none focus:border-signal transition-colors"
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            {err && (
              <div className="text-sm text-live font-mono">{err}</div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)] transition-all"
              >
                Join session
                <span className="font-mono">→</span>
              </button>
              <span className="text-xs text-muted-foreground">
                By joining you agree to the <Link to="/" className="underline hover:text-foreground">code of conduct</Link>.
              </span>
            </div>
          </form>
        </section>

        {/* Right: happening now */}
        <aside className="md:sticky md:top-16 self-start">
          <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Happening now
              </h3>
              <span className="font-mono text-[10px] text-signal">{live.length} rooms</span>
            </div>
            <ul className="mt-4 space-y-2">
              {live.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setCode(s.id)}
                    className="w-full text-left rounded-lg border border-border/60 bg-background/40 p-3 hover:border-signal/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{s.title}</span>
                      {s.status === "live" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-live/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-live">
                          <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-dot" />
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {s.startedAt.split("·")[1]?.trim() ?? "Soon"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>{s.id}</span>
                      <span>{s.participantCount} in room</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-surface/40 p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              What to expect
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-signal">◉</span> Live transcript with speaker labels</li>
              <li className="flex gap-2"><span className="text-signal">◉</span> Adjust caption size & contrast</li>
              <li className="flex gap-2"><span className="text-signal">◉</span> React, bookmark, and ask questions</li>
              <li className="flex gap-2"><span className="text-signal">◉</span> Download the transcript when it ends</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
