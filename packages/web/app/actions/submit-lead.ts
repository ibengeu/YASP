/**
 * Submit Lead Action — adds captured email to Resend Contacts API
 *
 * Security: OWASP A09:2025 (SSRF) — Hardcoded Resend endpoint, no user-controlled URLs
 * Security: OWASP A02:2025 (Misconfiguration) — API key from env only, never exposed to client
 * Security: OWASP A07:2025 (Injection) — Email validated before submission
 */

import { validateEmail, sanitizeEmail } from '@yasp/core/lib/email-validation';

// Mitigation: OWASP A09:2025 — Hardcoded endpoint prevents SSRF
const RESEND_CONTACTS_URL = 'https://api.resend.com/contacts';

export interface SubmitLeadInput {
  email: string;
  source: string;
}

export interface SubmitLeadResult {
  success: boolean;
  error?: string;
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  const email = sanitizeEmail(input.email);

  // Mitigation: OWASP A07:2025 — Validate before sending to external API
  if (!validateEmail(email)) {
    return { success: false, error: 'Invalid email address' };
  }

  try {
    const response = await fetch(RESEND_CONTACTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Email service error (${response.status})` };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add contact';
    return { success: false, error: message };
  }
}
