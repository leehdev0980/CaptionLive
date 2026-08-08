import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/dashboard/new")({
  head: () => ({
    meta: [
      { title: "New session — LiveCaption Hub" },
      { name: "description", content: "Configure a new live captioning session." },
    ],
  }),
  component: NewSessionWizard,
});

type Step = 1 | 2 | 3 | 4;

interface Draft {
  title: string;
  description: string;
  scheduledFor: "now" | "later";
  scheduleAt: string;
  language: string;
  translateTo: string[];
  model: "small" | "medium" | "large";
  speakerAttribution: boolean;
  profanityFilter: boolean;
  visibility: "workspace" | "link" | "invite";
  allowQuestions: boolean;
  allowReactions: boolean;
  allowBookmarks: boolean;
  recordAudio: boolean;
  autoSummary: boolean;
  slackChannel: string;
}

const languages = [
  "English (US)",
  "English (UK)",
  "Spanish",
  "French",
  "German",
  "Portuguese (BR)",
  "Swahili",
  "Hindi",
  "Mandarin",
  "Japanese",
];

const stepMeta = [
  { n: 1, label: "Basics" },
  { n: 2, label: "Audio & language" },
  { n: 3, label: "Access & engagement" },
  { n: 4, label: "Review" },
] as const;

function NewSessionWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    description: "",
    scheduledFor: "now",
    scheduleAt: "",
    language: "English (US)",
    translateTo: [],
    model: "small",
    speakerAttribution: true,
    profanityFilter: false,
    visibility: "workspace",
    allowQuestions: true,
    allowReactions: true,
    allowBookmarks: true,
    recordAudio: true,
    autoSummary: true,
    slackChannel: "",
  });

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const canAdvance = useMemo(() => {
    if (step === 1) return draft.title.trim().length > 2;
    return true;
  }, [step, draft.title]);

  const next = () => setStep((s) => (Math.min(4, s + 1) as Step));
  const back = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const launch = () => {
    // Simulated: hand off to the live session view.
    navigate({ to: "/sessions/$id", params: { id: "s-01H" } });
  };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-5xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Workspace · Kifaru Labs
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              New session
            </h1>
          </div>
          <Link
            to="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to sessions
          </Link>
        </div>

        {/* Stepper */}
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {stepMeta.map(({ n, label }) => {
            const active = step === n;
            const done = step > n;
            return (
              <li key={n}>
                <button
                  onClick={() => done && setStep(n as Step)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    active
                      ? "border-signal/60 bg-signal/5"
                      : done
                        ? "border-border bg-surface/60 hover:bg-surface"
                        : "border-border/60 bg-surface/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] h-5 w-5 grid place-items-center rounded ${
                        active
                          ? "bg-signal text-primary-foreground"
                          : done
                            ? "bg-signal/20 text-signal"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : n}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-widest ${
                        active ? "text-signal" : "text-muted-foreground"
                      }`}
                    >
                      Step {n}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{label}</div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Panel */}
        <div className="mt-6 rounded-xl border border-border bg-surface/40 p-6 md:p-8">
          {step === 1 && <StepBasics draft={draft} update={update} />}
          {step === 2 && <StepAudio draft={draft} update={update} />}
          {step === 3 && <StepAccess draft={draft} update={update} />}
          {step === 4 && <StepReview draft={draft} />}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 1}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Save as draft
            </Link>
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)] disabled:opacity-40 disabled:hover:shadow-none"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={launch}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-live-dot" />
                {draft.scheduledFor === "now" ? "Start session" : "Schedule session"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* -------------------- Step components -------------------- */

function StepBasics({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="Session title" hint="Shown to participants when they join.">
        <input
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Q3 Product Review"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-signal/60 focus:ring-2 focus:ring-ring/40"
        />
      </Field>

      <Field label="Description" hint="Optional. Agenda, links, or context.">
        <textarea
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Roadmap walkthrough, then Q&A."
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-signal/60 focus:ring-2 focus:ring-ring/40"
        />
      </Field>

      <Field label="When">
        <div className="grid sm:grid-cols-2 gap-3">
          <RadioCard
            active={draft.scheduledFor === "now"}
            onClick={() => update("scheduledFor", "now")}
            title="Start now"
            desc="Open the live room immediately after launch."
            icon="◉"
          />
          <RadioCard
            active={draft.scheduledFor === "later"}
            onClick={() => update("scheduledFor", "later")}
            title="Schedule"
            desc="Pick a date & time. We'll notify invitees."
            icon="◷"
          />
        </div>
        {draft.scheduledFor === "later" && (
          <input
            type="datetime-local"
            value={draft.scheduleAt}
            onChange={(e) => update("scheduleAt", e.target.value)}
            className="mt-3 w-full sm:w-72 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-signal/60"
          />
        )}
      </Field>
    </div>
  );
}

function StepAudio({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  const toggleLang = (l: string) => {
    const set = new Set(draft.translateTo);
    if (set.has(l)) set.delete(l);
    else set.add(l);
    update("translateTo", Array.from(set));
  };

  return (
    <div className="space-y-6">
      <Field label="Primary language" hint="The language spoken during the session.">
        <select
          value={draft.language}
          onChange={(e) => update("language", e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-signal/60"
        >
          {languages.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Live translation"
        hint="Participants can switch to any of these while watching."
      >
        <div className="flex flex-wrap gap-2">
          {languages
            .filter((l) => l !== draft.language)
            .map((l) => {
              const on = draft.translateTo.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => toggleLang(l)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-signal/60 bg-signal/10 text-signal"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {on ? "✓ " : "+ "}
                  {l}
                </button>
              );
            })}
        </div>
      </Field>

      <Field label="Transcription model">
        <div className="grid sm:grid-cols-3 gap-3">
          <RadioCard
            active={draft.model === "small"}
            onClick={() => update("model", "small")}
            title="Small · Fast"
            desc="~500 ms latency. Best for standups."
            icon="▲"
          />
          <RadioCard
            active={draft.model === "medium"}
            onClick={() => update("model", "medium")}
            title="Medium"
            desc="Balanced accuracy & speed."
            icon="◆"
          />
          <RadioCard
            active={draft.model === "large"}
            onClick={() => update("model", "large")}
            title="Large · Accurate"
            desc="Best for lectures & interviews."
            icon="●"
          />
        </div>
      </Field>

      <Field label="Options">
        <div className="space-y-1">
          <Toggle
            label="Speaker attribution"
            desc="Auto-detect who's speaking and label each line."
            value={draft.speakerAttribution}
            onChange={(v) => update("speakerAttribution", v)}
          />
          <Toggle
            label="Profanity filter"
            desc="Mask flagged terms in the live caption stream."
            value={draft.profanityFilter}
            onChange={(v) => update("profanityFilter", v)}
          />
        </div>
      </Field>
    </div>
  );
}

function StepAccess({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <Field label="Who can join">
        <div className="grid sm:grid-cols-3 gap-3">
          <RadioCard
            active={draft.visibility === "workspace"}
            onClick={() => update("visibility", "workspace")}
            title="Workspace"
            desc="Anyone in Kifaru Labs."
            icon="◐"
          />
          <RadioCard
            active={draft.visibility === "link"}
            onClick={() => update("visibility", "link")}
            title="Anyone with link"
            desc="Public join code, no sign-in needed."
            icon="⌘"
          />
          <RadioCard
            active={draft.visibility === "invite"}
            onClick={() => update("visibility", "invite")}
            title="Invite only"
            desc="You approve each participant."
            icon="◇"
          />
        </div>
      </Field>

      <Field label="Participant tools">
        <div className="space-y-1">
          <Toggle
            label="Q&A"
            desc="Participants can post & upvote questions."
            value={draft.allowQuestions}
            onChange={(v) => update("allowQuestions", v)}
          />
          <Toggle
            label="Reactions"
            desc="Live floating emoji feedback."
            value={draft.allowReactions}
            onChange={(v) => update("allowReactions", v)}
          />
          <Toggle
            label="Bookmarks"
            desc="Save timestamps for later reference."
            value={draft.allowBookmarks}
            onChange={(v) => update("allowBookmarks", v)}
          />
        </div>
      </Field>

      <Field label="After the session">
        <div className="space-y-1">
          <Toggle
            label="Record raw audio"
            desc="Kept for 30 days, then auto-deleted."
            value={draft.recordAudio}
            onChange={(v) => update("recordAudio", v)}
          />
          <Toggle
            label="Auto-generate summary"
            desc="AI recap + action items emailed to attendees."
            value={draft.autoSummary}
            onChange={(v) => update("autoSummary", v)}
          />
        </div>
      </Field>

      <Field label="Post transcript to Slack" hint="Optional. Leave blank to skip.">
        <input
          value={draft.slackChannel}
          onChange={(e) => update("slackChannel", e.target.value)}
          placeholder="#captions"
          className="w-full sm:w-72 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-signal/60"
        />
      </Field>
    </div>
  );
}

function StepReview({ draft }: { draft: Draft }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Review
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold">
          {draft.title || "Untitled session"}
        </h2>
        {draft.description && (
          <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ReviewCard title="Schedule">
          <ReviewRow k="When" v={draft.scheduledFor === "now" ? "Start immediately" : draft.scheduleAt || "—"} />
          <ReviewRow k="Language" v={draft.language} />
          <ReviewRow k="Translate to" v={draft.translateTo.length ? draft.translateTo.join(", ") : "—"} />
        </ReviewCard>

        <ReviewCard title="Audio">
          <ReviewRow k="Model" v={`whisper-${draft.model}`} />
          <ReviewRow k="Speaker attribution" v={draft.speakerAttribution ? "On" : "Off"} />
          <ReviewRow k="Profanity filter" v={draft.profanityFilter ? "On" : "Off"} />
        </ReviewCard>

        <ReviewCard title="Access">
          <ReviewRow k="Visibility" v={{ workspace: "Workspace", link: "Anyone with link", invite: "Invite only" }[draft.visibility]} />
          <ReviewRow k="Q&A" v={draft.allowQuestions ? "On" : "Off"} />
          <ReviewRow k="Reactions" v={draft.allowReactions ? "On" : "Off"} />
          <ReviewRow k="Bookmarks" v={draft.allowBookmarks ? "On" : "Off"} />
        </ReviewCard>

        <ReviewCard title="After">
          <ReviewRow k="Record audio" v={draft.recordAudio ? "Yes · 30d retention" : "No"} />
          <ReviewRow k="Auto summary" v={draft.autoSummary ? "Yes" : "No"} />
          <ReviewRow k="Slack" v={draft.slackChannel || "—"} />
        </ReviewCard>
      </div>

      <div className="rounded-lg border border-signal/30 bg-signal/5 p-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal animate-live-dot" />
          Ready to launch
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cluster ready · US-East · estimated first caption in ~700 ms.
        </p>
      </div>
    </div>
  );
}

/* -------------------- Primitives -------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RadioCard({
  active,
  onClick,
  title,
  desc,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border p-4 transition-colors ${
        active
          ? "border-signal/60 bg-signal/5 shadow-[0_0_0_1px_var(--signal-glow)]"
          : "border-border bg-surface/40 hover:bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-xs h-6 w-6 grid place-items-center rounded ${
            active ? "bg-signal/20 text-signal" : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg px-3 py-3 hover:bg-surface/60 cursor-pointer">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-signal" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-right max-w-[60%] truncate">{v}</span>
    </div>
  );
}
