import { ArrowLeft, CheckCircle2, Loader2, Upload, XCircle } from 'lucide-react';

import Card from '../components/Card';
import { clsx } from 'clsx';

export default function ProcessingView({ sessionTitle, importState, onBack, onRetry }) {
  const isError = importState.status === 'error';
  const Icon = isError ? XCircle : importState.status === 'complete' ? CheckCircle2 : Loader2;

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 py-8 text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to landing
        </button>

        <Card title={isError ? 'Import needs attention' : 'Processing imported media'} subtitle={sessionTitle}>
          <div className="flex items-start gap-4">
            <div
              className={clsx(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                isError
                  ? 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]'
                  : 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]'
              )}
            >
              <Icon className={clsx('h-6 w-6', importState.status === 'processing' && 'animate-spin')} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{importState.label}</p>
              <p className="mt-1 break-words text-sm text-[hsl(var(--muted-foreground))]">{importState.detail}</p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    isError ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--primary))]'
                  )}
                  style={{ width: `${importState.progress}%` }}
                />
              </div>

              {isError && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))]"
                >
                  <Upload className="h-4 w-4" />
                  Try again
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
