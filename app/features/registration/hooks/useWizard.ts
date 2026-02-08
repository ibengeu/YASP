/**
 * useWizard Hook - State machine for multi-step wizard forms
 *
 * Provides robust step management with validation, navigation, and state tracking.
 * Can be reused across any multi-step form in the application.
 */

import { useState, useCallback } from 'react';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isOptional?: boolean;
}

export interface WizardState<T extends number = number> {
  currentStep: T;
  visitedSteps: Set<T>;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
}

export interface WizardActions<T extends number = number> {
  goToNext: () => Promise<boolean>;
  goToBack: () => void;
  goToStep: (step: T) => void;
  reset: () => void;
  markStepVisited: (step: T) => void;
}

export interface UseWizardOptions<T extends number = number> {
  steps: readonly WizardStep[];
  initialStep?: T;
  onStepChange?: (step: T) => void;
  onComplete?: () => void | Promise<void>;
  validateStep?: (step: T) => Promise<boolean>;
}

export interface UseWizardReturn<T extends number = number> {
  state: WizardState<T>;
  actions: WizardActions<T>;
  steps: readonly WizardStep[];
}

export function useWizard<T extends number = number>(
  options: UseWizardOptions<T>
): UseWizardReturn<T> {
  const { steps, initialStep, onStepChange, onComplete, validateStep } = options;

  const firstStep = (steps[0]?.id ?? 1) as T;
  const lastStep = (steps[steps.length - 1]?.id ?? steps.length) as T;

  const [currentStep, setCurrentStep] = useState<T>(initialStep ?? firstStep);
  const [visitedSteps, setVisitedSteps] = useState<Set<T>>(new Set([initialStep ?? firstStep]));

  const isFirstStep = currentStep === firstStep;
  const isLastStep = currentStep === lastStep;
  const canGoNext = !isLastStep;
  const canGoBack = !isFirstStep;

  const markStepVisited = useCallback((step: T) => {
    setVisitedSteps((prev) => new Set(prev).add(step));
  }, []);

  const goToStep = useCallback(
    (step: T) => {
      if (step >= firstStep && step <= lastStep) {
        setCurrentStep(step);
        markStepVisited(step);
        onStepChange?.(step);
      }
    },
    [firstStep, lastStep, markStepVisited, onStepChange]
  );

  const goToNext = useCallback(async (): Promise<boolean> => {
    if (!canGoNext) {
      // If on last step, trigger completion
      if (isLastStep) {
        await onComplete?.();
        return true;
      }
      return false;
    }

    // Validate current step before proceeding
    if (validateStep) {
      const isValid = await validateStep(currentStep);
      if (!isValid) {
        return false;
      }
    }

    const nextStep = (currentStep + 1) as T;
    goToStep(nextStep);
    return true;
  }, [canGoNext, isLastStep, validateStep, currentStep, goToStep, onComplete]);

  const goToBack = useCallback(() => {
    if (canGoBack) {
      const prevStep = (currentStep - 1) as T;
      goToStep(prevStep);
    }
  }, [canGoBack, currentStep, goToStep]);

  const reset = useCallback(() => {
    setCurrentStep(firstStep);
    setVisitedSteps(new Set([firstStep]));
  }, [firstStep]);

  return {
    state: {
      currentStep,
      visitedSteps,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoBack,
    },
    actions: {
      goToNext,
      goToBack,
      goToStep,
      reset,
      markStepVisited,
    },
    steps,
  };
}
