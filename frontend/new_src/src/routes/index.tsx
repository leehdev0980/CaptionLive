import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StaticWaveform, Waveform } from "@/components/waveform";
const heroBg = "/hero.png";
import { demoCaptions, getParticipant } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <LiveDemo />
        <HowItWorks />
        <Stats />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 30%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 -z-10 grid-noise opacity-40" />

      <div className="container-page pt-24 pb-32 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/5 px-3 py-1 text-xs font-mono text-signal">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            LIVE · Powered by OpenAI Whisper
          </div>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Every voice in the room,{" "}
            <span className="text-gradient">on the same page.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            LiveCaption Hub turns any meeting, lecture, or seminar into a
            synchronized, searchable transcript — streamed to every participant
            in under a second.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_32px_var(--signal-glow)]"
            >
              Start a session
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <Link
              to="/sessions/$id"
              params={{ id: "s-01H" }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-surface-2"
            >
              Watch live demo
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span>&lt; 900ms latency</span>
            <span className="text-signal/40">·</span>
            <span>Whisper Large-v3</span>
            <span className="text-signal/40">·</span>
            <span>SignalR sync</span>
            <span className="text-signal/40">·</span>
            <span>SOC-ready</span>
          </div>
        </div>

        <HeroCaptionCard />
      </div>
    </section>
  );
}

function HeroCaptionCard() {
  return (
    <div className="mt-20 rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-elevated overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-md bg-live/10 px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live animate-live-dot" />{" "}
            Rec
          </span>
          <span className="text-sm font-medium">Q3 Product Review</span>
          <span className="text-xs font-mono text-muted-foreground">
            12 participants
          </span>
        </div>
        <div className="hidden h-6 w-32 sm:block">
          <Waveform bars={20} className="h-full" />
        </div>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3 max-h-64 overflow-hidden">
          {demoCaptions.slice(0, 4).map((c, i) => {
            const p = getParticipant(c.speakerId);
            return (
              <div
                key={c.id}
                className="animate-caption-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: p.color }}
                  >
                    {p.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {c.timestamp}
                  </span>
                </div>
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  {c.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LogoStrip() {
  const names = [
    "MMU",
    "Faculty of CIT",
    "Whisper",
    "SignalR",
    "PostgreSQL",
    "React",
  ];
  return (
    <section className="border-b border-border/60 py-10">
      <div className="container-page">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Built on the stack that ships
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {names.map((n) => (
            <span
              key={n}
              className="font-display text-lg font-medium text-muted-foreground"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    title: "Real-time everyone-sees-everyone",
    body: "SignalR WebSocket fan-out keeps every browser in the session on the same caption line — no polling, no refresh.",
  },
  {
    title: "Whisper-grade accuracy",
    body: "PCM chunks stream to a Python microservice running OpenAI Whisper. Multilingual, punctuated, speaker-attributed.",
  },
  {
    title: "Any authorized speaker",
    body: "Multiple hosts can take the mic in one session. Roles: host, speaker, listener — all synchronized.",
  },
  {
    title: "Searchable session archive",
    body: "Every session persists to PostgreSQL. Full-text search across weeks of meetings, exportable as JSON or plain text.",
  },
  {
    title: "Sub-second propagation",
    body: "End-to-end latency measured under 900 ms — from mic capture to remote client render — under variable network.",
  },
  {
    title: "Accessible by design",
    body: "Adjustable caption size, high-contrast mode, and keyboard navigation across the entire product surface.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 border-b border-border/60">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-signal">
            // features
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            Captioning built for the whole room, not one screen.
          </h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group bg-background p-8 transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="text-signal">0{i + 1}</span>
                <span>/</span>
                <span>0{features.length}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveDemo() {
  return (
    <section className="py-24 border-b border-border/60">
      <div className="container-page grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-signal">
            // live view
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            One transcript. Every screen. Zero refresh.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Speakers press record. The audio is chunked, transcribed by Whisper
            on a dedicated microservice, and pushed back over SignalR to every
            connected client — usually before the next sentence starts.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "PCM audio chunks · 250ms windows",
              "ASP.NET Core routing + auth",
              "Whisper large-v3 inference",
              "SignalR broadcast to N clients",
            ].map((item, i) => (
              <li key={item} className="flex items-center gap-3 font-mono">
                <span className="flex h-6 w-6 items-center justify-center rounded border border-signal/40 text-xs text-signal">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-live animate-live-dot" />
              livecaptionhub.app/sessions/s-01H
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              READ-ONLY
            </span>
          </div>
          <div className="p-5 space-y-4 max-h-[420px] overflow-hidden">
            {demoCaptions.map((c, i) => {
              const p = getParticipant(c.speakerId);
              return (
                <div
                  key={c.id}
                  className="animate-caption-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: p.color }}
                    >
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {c.timestamp} · {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-4 py-3 h-14">
            <StaticWaveform className="h-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      k: "01",
      t: "Create a session",
      b: "Name it, pick a language, choose who can speak. Get a shareable link.",
    },
    {
      k: "02",
      t: "Invite the room",
      b: "Anyone on the link joins as a listener. Grant speaker rights on demand.",
    },
    {
      k: "03",
      t: "Speak, watch it appear",
      b: "Captions stream to every screen. Search, export, share when you're done.",
    },
  ];
  return (
    <section id="how-it-works" className="py-24 border-b border-border/60">
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-signal">
              // how it works
            </p>
            <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight max-w-xl">
              From silence to synced transcript in three steps.
            </h2>
          </div>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.k}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-8"
            >
              <div className="font-mono text-6xl font-semibold text-signal/20">
                {s.k}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {s.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "< 900ms", l: "End-to-end latency" },
    { v: "99.4%", l: "Word accuracy (EN)" },
    { v: "40+", l: "Languages supported" },
    { v: "∞", l: "Concurrent listeners" },
  ];
  return (
    <section className="py-24 border-b border-border/60">
      <div className="container-page">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-border">
          {stats.map((s) => (
            <div key={s.l} className="bg-background p-8 text-center">
              <div className="font-display text-4xl md:text-5xl font-semibold text-signal">
                {s.v}
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-signal/30 bg-surface p-12 md:p-16 text-center shadow-glow-lg">
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{ backgroundImage: "var(--gradient-radial-glow)" }}
          />
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              Bring your next meeting into focus.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Free for teams of five. No credit card. Live in 30 seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_32px_var(--signal-glow)]"
              >
                Start free
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-6 py-3 text-sm font-medium hover:bg-surface-2"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
