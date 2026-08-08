import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LiveCaption Hub" },
      {
        name: "description",
        content:
          "Simple plans for teams, classrooms, and enterprises. Start free, scale as you grow.",
      },
      { property: "og:title", content: "Pricing — LiveCaption Hub" },
      {
        property: "og:description",
        content: "Simple plans for teams, classrooms, and enterprises.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Solo",
    price: "$0",
    period: "forever",
    tagline: "For personal notes and small study groups.",
    features: [
      "Up to 5 participants",
      "60 min per session",
      "7-day transcript history",
      "English + Swahili",
      "Community support",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Team",
    price: "$18",
    period: "per host / month",
    tagline: "For product teams and daily standups.",
    features: [
      "Up to 50 participants",
      "Unlimited session length",
      "Unlimited history + search",
      "40+ languages",
      "Export to JSON / SRT / TXT",
      "Slack + Teams integration",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Campus",
    price: "Custom",
    period: "annual license",
    tagline: "For universities, conferences, and public sector.",
    features: [
      "Unlimited participants",
      "SSO / SAML",
      "On-premises Whisper option",
      "Custom SLA + DPA",
      "Dedicated support",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-signal">
            // pricing
          </p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight">
            Priced per host, not per listener.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Everyone in the room reads captions for free. You only pay for the
            person driving the session.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 transition-transform hover:-translate-y-1 ${
                t.featured
                  ? "border-signal/50 bg-surface shadow-glow"
                  : "border-border bg-surface/60"
              }`}
            >
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-signal px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-xl font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold">
                  {t.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t.period}
                </span>
              </div>
              <Link
                to={t.name === "Campus" ? "/auth" : "/dashboard"}
                className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  t.featured
                    ? "bg-primary text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)]"
                    : "border border-border bg-background hover:bg-surface-2"
                }`}
              >
                {t.cta}
              </Link>
              <ul className="mt-8 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-none text-signal"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.58l7.3-7.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-24 rounded-2xl border border-border bg-surface/40 p-10 text-center">
          <h2 className="font-display text-2xl font-semibold">
            Questions we hear a lot
          </h2>
          <div className="mt-8 grid gap-8 text-left md:grid-cols-2">
            {[
              [
                "Do listeners need an account?",
                "No. Anyone with the session link can read captions in real time. Only hosts and speakers sign in.",
              ],
              [
                "Where is my audio processed?",
                "Team plans use our managed Whisper cluster in EU / US. Campus plans can run Whisper on-prem.",
              ],
              [
                "Can I export transcripts?",
                "Yes — JSON, plain text, and SRT for every ended session on Team and Campus plans.",
              ],
              [
                "What about privacy?",
                "Transcripts are encrypted at rest. Audio chunks are discarded after transcription. Full DPA available for Campus.",
              ],
            ].map(([q, a]) => (
              <div key={q}>
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
