/**
 * Wizard Component - Reusable multi-step form container
 *
 * Provides a composable wizard interface with progress tracking,
 * navigation controls, and step management.
 */

import React, { createContext, useContext } from 'react';
import type { WizardState, WizardActions, WizardStep } from '@/features/registration/hooks/useWizard';

interface WizardContextValue {
  state: WizardState;
  actions: WizardActions;
  steps: readonly WizardStep[];
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizardContext() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('Wizard components must be used within a Wizard provider');
  }
  return context;
}

interface WizardProps {
  state: WizardState;
  actions: WizardActions;
  steps: readonly WizardStep[];
  children: React.ReactNode;
  className?: string;
}

export function Wizard({ state, actions, steps, children, className }: WizardProps) {
  return (
    <WizardContext.Provider value={{ state, actions, steps }}>
      <div className={className}>{children}</div>
    </WizardContext.Provider>
  );
}

interface WizardProgressProps {
  className?: string;
}

export function WizardProgress({ className }: WizardProgressProps) {
  const { state, steps } = useWizardContext();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step.id <= state.currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>
            {idx < steps.length - 1 && <div className="w-2" />}
          </div>
        ))}
      </div>
    </div>
  );
}

interface WizardStepProps {
  step: number;
  children: React.ReactNode;
}

export function WizardStepContainer({ step, children }: WizardStepProps) {
  const { state } = useWizardContext();

  if (state.currentStep !== step) {
    return null;
  }

  return <>{children}</>;
}

interface WizardNavigationProps {
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function WizardNavigation({
  onSubmit,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  backLabel = 'Back',
  isSubmitting = false,
  className,
}: WizardNavigationProps) {
  const { state, actions } = useWizardContext();

  const handleNext = async () => {
    if (state.isLastStep && onSubmit) {
      await onSubmit();
    } else {
      await actions.goToNext();
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between gap-3">
        {state.canGoBack ? (
          <button
            type="button"
            onClick={actions.goToBack}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {backLabel}
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? 'Submitting...' : state.isLastStep ? submitLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}
