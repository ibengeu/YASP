/**
 * AI Quick Fix Route
 * React Router v7 action for generating AI-powered spec fixes
 *
 * Security:
 * - OWASP A03:2025 (Injection): Safe prompt construction
 * - OWASP A06:2025 (Authentication): API key validation
 */

import { OpenRouterProvider, type QuickFixRequest } from '@/features/ai-catalyst/services/openrouter-provider';

const openRouterProvider = new OpenRouterProvider();

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const requestData = await request.json() as QuickFixRequest;

    // Generate the quick fix
    const quickFix = await openRouterProvider.generateQuickFix(requestData);
    return Response.json({ success: true, data: quickFix });
  } catch (error) {
    console.error('[Quick Fix] Generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quick fix';
    return Response.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
