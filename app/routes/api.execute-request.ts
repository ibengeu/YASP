/**
 * API Request Execution Route
 * React Router v7 action for executing external API requests
 *
 * Security:
 * - OWASP A09:2025 (SSRF): Comprehensive URL validation
 * - OWASP A04:2025 (Insecure Design): Request timeout
 * - OWASP A09:2025 (Security Logging): Safe error handling
 */

import { executeApiRequest, type ApiRequestData } from '@/actions/execute-api-request';

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const requestData = await request.json() as ApiRequestData;

    // Execute the API request
    const response = await executeApiRequest(requestData);

    return Response.json({ success: true, data: response });
  } catch (error) {
    console.error('[API Execute] Request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Request failed';
    return Response.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
