/**
 * Action Tracker — localStorage-based lead gate logic
 * Pure functions, no React dependencies
 *
 * Gate triggers after 3 meaningful user actions.
 * If dismissed, re-prompts after 3 more actions.
 * Once email is captured, gate never shows again.
 */

const KEYS = {
  actionCount: 'yasp_action_count',
  leadEmail: 'yasp_lead_email',
  dismissedAt: 'yasp_lead_dismissed_at',
} as const;

const GATE_THRESHOLD = 1;

export function incrementAction(): void {
  const count = getActionCount();
  localStorage.setItem(KEYS.actionCount, String(count + 1));
}

export function getActionCount(): number {
  const raw = localStorage.getItem(KEYS.actionCount);
  return raw ? parseInt(raw, 10) : 0;
}

export function shouldShowEmailGate(): boolean {
  if (hasLeadEmail()) return false;

  const count = getActionCount();
  const dismissedAt = localStorage.getItem(KEYS.dismissedAt);

  if (!dismissedAt) {
    return count >= GATE_THRESHOLD;
  }

  // After dismiss: re-prompt after GATE_THRESHOLD more actions
  const dismissedCount = parseInt(dismissedAt, 10);
  return count - dismissedCount >= GATE_THRESHOLD;
}

export function markEmailCaptured(email: string): void {
  localStorage.setItem(KEYS.leadEmail, email);
}

export function dismissEmailGate(): void {
  localStorage.setItem(KEYS.dismissedAt, String(getActionCount()));
}

export function hasLeadEmail(): boolean {
  return !!localStorage.getItem(KEYS.leadEmail);
}
