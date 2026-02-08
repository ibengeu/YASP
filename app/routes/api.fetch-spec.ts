/**
 * Spec Fetch Route
 * React Router v7 action for fetching OpenAPI specs from external URLs (server-side).
 * Bypasses CORS by proxying the request through the server.
 *
 * Security:
 * - OWASP A09:2025 (SSRF): URL validation via fetchSpec()
 * - OWASP A04:2025 (Insecure Design): POST-only, timeout enforced
 */

import { fetchSpec } from '@/actions/fetch-spec';

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { url } = (await request.json()) as { url: string };

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'Missing or invalid "url" field' }, { status: 400 });
    }

    const result = await fetchSpec(url);

    if (result.error) {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }

    return Response.json({ success: true, content: result.content });
  } catch (error) {
    console.error('[Fetch Spec] Request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch specification';
    return Response.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
