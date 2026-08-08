import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — LiveCaption Hub" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Workspace
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Settings
        </h1>

        <div className="mt-10 space-y-8">
          <Card title="Transcription">
            <Row k="Default language" v="English (US)" />
            <Row k="Model" v="whisper-large-v3" />
            <Row k="Region" v="US-East" />
            <Row k="Speaker attribution" v="On" />
          </Card>

          <Card title="Captions">
            <Row k="Font size" v="Medium" />
            <Row k="High contrast" v="Off" />
            <Row k="Show confidence" v="On" />
          </Card>

          <Card title="Integrations">
            <Row k="Slack" v="Connected · #captions" />
            <Row k="Microsoft Teams" v="Not connected" />
            <Row k="Zapier" v="Not connected" />
          </Card>

          <Card title="Danger zone" tone="danger">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Delete workspace</div>
                <div className="text-xs text-muted-foreground">
                  Permanent. Removes all sessions and transcripts.
                </div>
              </div>
              <button className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20">
                Delete
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border p-6 ${tone === "danger" ? "border-destructive/30 bg-destructive/5" : "border-border bg-surface/40"}`}
    >
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}
