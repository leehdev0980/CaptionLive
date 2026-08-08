import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/logo";
const heroBg = "/hero.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LiveCaption Hub" },
      {
        name: "description",
        content:
          "Sign in to LiveCaption Hub to host and manage real-time captioning sessions.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left visual panel */}
      <div className="relative hidden md:block border-r border-border/60 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 grid-noise opacity-30" />
        <div className="relative h-full flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-lg font-semibold">
              LiveCaption <span className="text-signal">Hub</span>
            </span>
          </Link>
          <div>
            <blockquote className="font-display text-2xl leading-snug tracking-tight">
              "We stopped taking notes in standup. The transcript is better than
              anyone's handwriting anyway."
            </blockquote>
            <div className="mt-4 font-mono text-sm text-muted-foreground">
              Priya N. — Staff Engineer, Kifaru Labs
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8 flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-lg font-semibold">
              LiveCaption Hub
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back." : "Create your workspace."}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to host and manage sessions."
              : "Free for teams of five. No card required."}
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
          >
            {mode === "signup" && (
              <Field
                label="Full name"
                name="name"
                type="text"
                placeholder="Alex Muiruri"
              />
            )}
            <Field
              label="Work email"
              name="email"
              type="email"
              placeholder="you@company.com"
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
            />

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[0_0_24px_var(--signal-glow)]"
            >
              {mode === "signin" ? "Sign in" : "Create workspace"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button className="mt-6 w-full rounded-lg border border-border bg-surface/60 px-4 py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors">
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="text-signal hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-signal focus:ring-2 focus:ring-signal/30"
      />
    </label>
  );
}
