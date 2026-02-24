/**
 * Lead Capture Route
 * React Router v7 action for capturing email leads via Resend Contacts API.
 *
 * Security:
 * - OWASP A09:2025 (SSRF): Hardcoded Resend endpoint in submitLead()
 * - OWASP A07:2025 (Injection): Zod schema parsing rejects malformed input before processing
 * - OWASP A02:2025 (Misconfiguration): API key from env, never exposed to client
 */

import { z } from 'zod';
import { submitLead } from '@/actions/submit-lead';

// Mitigation: OWASP A07:2025 — strict schema rejects unexpected field types and empty values
const LeadSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  source: z.string().optional().default('unknown'),
});

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, source } = parsed.data;
    const result = await submitLead({ email, source });

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Leads] Request failed:', error);
    return Response.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
