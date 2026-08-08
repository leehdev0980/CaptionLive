import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type WizardStep<TValues> = {
  id: string;
  title: string;
  description?: string;
  content: (args: {
    values: TValues;
    setValues: (next: TValues) => void;
  }) => ReactNode;
};

export function WizardDialog<TValues extends Record<string, unknown>>(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: WizardStep<TValues>[];
  initialValues: TValues;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (values: TValues) => Promise<void> | void;
  validate?: (
    values: TValues,
  ) => Partial<Record<keyof TValues, string>> | null;
}) {
  const {
    open,
    onOpenChange,
    title,
    description,
    steps,
    initialValues,
    submitLabel = "Submit",
    cancelLabel = "Cancel",
    onSubmit,
    validate,
  } = props;

  const [stepIdx, setStepIdx] = useState<number>(0);
  const [values, setValues] = useState<TValues>(initialValues);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [
    errors,
    setErrors,
  ] = useState<Partial<Record<keyof TValues, string>>>({});

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setValues(initialValues);
    setSubmitting(false);
    setErrors({});
  }, [open, initialValues]);

  const activeStep = steps[stepIdx];

  const runValidation = () => {
    if (!validate) return true;
    const next = validate(values) ?? {};
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const canBack = stepIdx > 0;
  const canNext = stepIdx < steps.length - 1;

  const handleNext = async () => {
    if (!runValidation()) return;
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = async () => {
    if (!runValidation()) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="mt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground font-mono">
              Step {stepIdx + 1} of {steps.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeStep?.title}
            </div>
          </div>

          <div className="mt-4">
            {activeStep?.description ? (
              <div className="text-sm text-muted-foreground mb-3">
                {activeStep.description}
              </div>
            ) : null}

            {activeStep?.content({
              values,
              setValues,
            })}
          </div>

          {Object.keys(errors).length ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {Object.values(errors)
                .filter((v): v is string => typeof v === "string" && v.length)
                .map((m, idx) => (
                  <div key={idx}>{m}</div>
                ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={!canBack || submitting}
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {canNext ? (
                <Button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={submitting}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : submitLabel}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
              {cancelLabel}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

