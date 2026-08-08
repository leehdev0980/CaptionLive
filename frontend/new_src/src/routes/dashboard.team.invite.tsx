import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/dashboard/team/invite")({
  head: () => ({
    meta: [
      { title: "Invite team — LiveCaption Hub" },
      { name: "description", content: "Invite members to your captioning workspace." },
    ],
  }),
  component: InviteTeamPage,
});

type Role = "admin" | "host" | "member" | "viewer";

interface Invitee {
  id: string;
  email: string;
  role: Role;
}

const roleOptions: { value: Role; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Manage billing, members, and all sessions." },
  { value: "host", label: "Host", desc: "Create sessions and invite participants." },
  { value: "member", label: "Member", desc: "Join and contribute to sessions." },
  { value: "viewer", label: "Viewer", desc: "Read-only access to transcripts." },
];

const suggested = [
  { name: "Kabelo Mahlangu", email: "kabelo@kifaru.co" },
  { name: "Rina Watanabe", email: "rina@kifaru.co" },
  { name: "Tomás Salgado", email: "tomas@kifaru.co" },
  { name: "Fatima Ahmed", email: "fatima@kifaru.co" },
];

const pending = [
  { email: "chidi@kifaru.co", role: "host" as Role, sentAt: "2h ago" },
  { email: "lin@kifaru.co", role: "member" as Role, sentAt: "yesterday" },
];

let idc = 0;
const nid = () => `i${++idc}`;

function InviteTeamPage() {
  const [invitees, setInvitees] = useState<Invitee[]>([
    { id: nid(), email: "", role: "member" },
  ]);
  const [defaultRole, setDefaultRole] = useState<Role>("member");
  const [message, setMessage] = useState("");
  const [linkRole, setLinkRole] = useState<Role>("member");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const inviteLink = useMemo(
    () => `https://livecaption.hub/invite/kifaru-labs?role=${linkRole}&t=8f2a1c`,
    [linkRole],
  );

  const validCount = invitees.filter((i) => /.+@.+\..+/.test(i.email)).length;

  const updateInvitee = (id: string, patch: Partial<Invitee>) =>
    setInvitees((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeInvitee = (id: string) =>
    setInvitees((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));

  const addRow = () =>
    setInvitees((rows) => [...rows, { id: nid(), email: "", role: defaultRole }]);

  const addFromSuggested = (email: string) => {
    if (invitees.some((i) => i.email === email)) return;
    setInvitees((rows) => {
      const empty = rows.find((r) => !r.email);
      if (empty) return rows.map((r) => (r.id === empty.id ? { ...r, email } : r));
      return [...rows, { id: nid(), email, role: defaultRole }];
    });
  };

  const pasteBulk = (raw: string) => {
    const emails = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => /.+@.+\..+/.test(s));
    if (!emails.length) return;
    setInvitees((rows) => {
      const existing = new Set(rows.map((r) => r.email));
      const merged = rows.filter((r) => r.email);
      for (const email of emails) {
        if (!existing.has(email)) {
          merged.push({ id: nid(), email, role: defaultRole });
          existing.add(email);
        }
      }
      return merged.length ? merged : [{ id: nid(), email: "", role: defaultRole }];
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  const sendInvites = () => {
    if (!validCount) return;
    setSent(true);
    setTimeout(() => setSent(false), 2200);
    setInvitees([{ id: nid(), email: "", role: defaultRole }]);
    setMessage("");
  };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Workspace · Kifaru Labs
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              Invite team
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Add teammates by email, share an invite link, or import from your directory. Roles can be changed any time.
            </p>
          </div>
          <Link
            to="/dashboard/team"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to team
          </Link>
        </div>

        <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main column */}
          <div className="space-y-8">
            {/* Email invites */}
            <section className="rounded-xl border border-border bg-surface/40 p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-lg font-semibold">Invite by email</h2>
                  <p className="text-xs text-muted-foreground">
                    Each person gets a personal join link within seconds.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Default role
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value as Role)}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {invitees.map((row, i) => (
                  <div key={row.id} className="grid grid-cols-[1fr_140px_auto] gap-2">
                    <input
                      autoFocus={i === invitees.length - 1}
                      value={row.email}
                      onChange={(e) => updateInvitee(row.id, { email: e.target.value })}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        if (/[\s,;]/.test(text)) {
                          e.preventDefault();
                          pasteBulk(text);
                        }
                      }}
                      placeholder="name@company.com"
                      type="email"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal/60 focus:ring-2 focus:ring-ring/40"
                    />
                    <select
                      value={row.role}
                      onChange={(e) => updateInvitee(row.id, { role: e.target.value as Role })}
                      className="rounded-lg border border-border bg-background px-2 py-2 text-xs"
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeInvitee(row.id)}
                      disabled={invitees.length === 1}
                      className="rounded-lg border border-border px-2.5 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove row"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="mt-3 text-xs text-signal hover:underline"
              >
                + Add another
              </button>

              <div className="mt-5">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Personal note <span className="normal-case text-muted-foreground/70">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder="Hey — join our captioning workspace so you can follow the Q3 review live."
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal/60 focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="font-mono text-[11px] text-muted-foreground">
                  {validCount} invitee{validCount === 1 ? "" : "s"} ready
                </div>
                <div className="flex items-center gap-3">
                  {sent && (
                    <span className="font-mono text-[11px] text-signal">
                      ✓ Invitations sent
                    </span>
                  )}
                  <button
                    onClick={sendInvites}
                    disabled={!validCount}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:shadow-[0_0_24px_var(--signal-glow)] disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    Send {validCount || ""} invite{validCount === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            </section>

            {/* Invite link */}
            <section className="rounded-xl border border-border bg-surface/40 p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-lg font-semibold">Share an invite link</h2>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can join with the selected role. Rotate anytime.
                  </p>
                </div>
                <select
                  value={linkRole}
                  onChange={(e) => setLinkRole(e.target.value as Role)}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      Joins as {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-muted-foreground">
                  {inviteLink}
                </code>
                <button
                  onClick={copyLink}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-mono hover:bg-surface"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button className="rounded-lg border border-border px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-surface">
                  ⟳ Rotate
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span>Expires in 7 days</span>
                <span>·</span>
                <span>Uses left: unlimited</span>
                <span>·</span>
                <span>Domain: kifaru.co only</span>
              </div>
            </section>

            {/* Roles reference */}
            <section className="rounded-xl border border-border bg-surface/40 p-6">
              <h2 className="font-display text-lg font-semibold">Roles &amp; permissions</h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {roleOptions.map((r) => (
                  <div key={r.value} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-signal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-signal">
                        {r.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-xl border border-border bg-surface/40 p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Suggested from your domain
              </h3>
              <ul className="mt-3 space-y-1">
                {suggested.map((s) => {
                  const added = invitees.some((i) => i.email === s.email);
                  return (
                    <li
                      key={s.email}
                      className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate">{s.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">
                          {s.email}
                        </div>
                      </div>
                      <button
                        onClick={() => addFromSuggested(s.email)}
                        disabled={added}
                        className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-mono ${
                          added
                            ? "border-signal/40 text-signal"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {added ? "Added" : "+ Add"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-surface/40 p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Pending invitations
              </h3>
              <ul className="mt-3 divide-y divide-border/60">
                {pending.map((p) => (
                  <li key={p.email} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{p.email}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {p.role} · sent {p.sentAt}
                      </div>
                    </div>
                    <button className="text-[11px] font-mono text-muted-foreground hover:text-foreground">
                      Resend
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-signal/30 bg-signal/5 p-5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-signal">
                Seats
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold">7</span>
                <span className="text-xs text-muted-foreground">of 15 used</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-signal" style={{ width: "46%" }} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Team plan · 8 seats available.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
