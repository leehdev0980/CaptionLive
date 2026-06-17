import { useMemo, useState } from 'react';
import { BadgeCheck, Users, XCircle } from 'lucide-react';

import Card from '../components/Card';
import StatusPill from '../components/StatusPill';

const USER_TYPES = [
  { id: 'student', label: 'Student' },
  { id: 'speaker', label: 'Speaker' },
  { id: 'broadcaster', label: 'Broadcaster' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'accessibility', label: 'Accessibility user' }
];

export default function Onboarding({
  sessionTitle,
  selectedUserTypes,
  onToggleType,
  onBack,
  selectedInputModes,
  onToggleInputMode,
  onContinue,
  error
}) {
  const [localError, setLocalError] = useState('');
  const picked = selectedUserTypes ?? [];
  const inputModes = selectedInputModes ?? [];

  const selectedLabels = useMemo(() => {
    const set = new Set(picked);
    return USER_TYPES.filter((t) => set.has(t.id)).map((t) => t.label);
  }, [picked]);

  // validate() removed: we use rolesValid/inputsValid gating instead.

  const rolesValid = !!picked.length;
  const inputsValid = !!inputModes.length;

  const handleContinue = () => {
    if (!rolesValid) {
      setLocalError('Select at least one user type to continue.');
      return;
    }
    if (!inputsValid) {
      setLocalError('Select at least one input mode to continue.');
      return;
    }
    setLocalError('');
    onContinue();
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-[hsl(var(--background))] px-4 py-8 text-[hsl(var(--foreground))]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center gap-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            <Users className="h-4 w-4" />
            Back
          </button>

          <StatusPill icon={BadgeCheck} label="Onboarding" tone="primary" />
        </div>

        <Card title="Who is using this session?" subtitle={sessionTitle}>
          <div className="space-y-5">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Choose one or more roles. The UI will prioritize the tools that fit your use-case.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {USER_TYPES.map((t) => {
                const isActive = picked.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggleType(t.id)}
                    className={[
                      'rounded-lg border p-4 text-left transition',
                      isActive
                        ? 'border-[hsl(var(--primary))]/60 bg-[hsl(var(--primary))]/15'
                        : 'border-[hsl(var(--border-bright))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary))]/40'
                    ].join(' ')}
                  >
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {isActive ? 'Selected' : 'Tap to select'}
                    </p>
                  </button>
                );
              })}
            </div>

            {(error || localError) && (
              <div className="flex items-start gap-2 rounded-md border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-3 text-xs text-[hsl(var(--destructive))]">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error || localError}
              </div>
            )}

            {(!rolesValid || !inputsValid) && !(error || localError) && (
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 text-xs text-[hsl(var(--muted-foreground))]">
                <p className="font-semibold text-[hsl(var(--foreground))]">To continue, please complete:</p>
                <ul className="mt-1 list-disc pl-5">
                  {!rolesValid && <li>Select at least one user type.</li>}
                  {!inputsValid && (
                    <li>Select at least one input mode (Live microphone / Import file / Import URL).</li>
                  )}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Current selection</p>
              <p className="mt-1 text-sm font-semibold">
                {selectedLabels.length ? selectedLabels.join(', ') : '—'}
              </p>
            </div>

            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
              <p className="text-sm font-semibold">How do you want to input media?</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Choose one or more modes. If a role doesn’t use a feature, it may be disabled.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'mic', title: 'Live microphone', subtitle: 'Real-time captioning' },
                  { id: 'file', title: 'Import file', subtitle: 'Upload audio/video' },
                  { id: 'url', title: 'Import URL', subtitle: 'Use a direct media link' }
                ].map((m) => {
                  const isActive = inputModes.includes(m.id);
                  const canUse =
                    // Minimal role gating: if user picked at least one role, allow all modes for now.
                    // Future: disable specific modes based on selectedUserTypes.
                    picked.length > 0;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => canUse && onToggleInputMode(m.id)}
                      disabled={!canUse}
                      className={[
                        'rounded-lg border p-4 text-left transition',
                        isActive
                          ? 'border-[hsl(var(--primary))]/60 bg-[hsl(var(--primary))]/15'
                          : 'border-[hsl(var(--border-bright))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary))]/40',
                        !canUse ? 'cursor-not-allowed opacity-50' : ''
                      ].join(' ')}
                    >
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{m.subtitle}</p>
                      <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                        {isActive ? 'Selected' : 'Tap to select'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!rolesValid || !inputsValid}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
