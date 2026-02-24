/**
 * API Request Proxy Service
 * Executes real API requests with SSRF protection
 *
 * Security:
 * - OWASP A09:2025 (SSRF): Comprehensive URL validation before request
 * - OWASP A04:2025 (Insecure Design): Request timeout to prevent hanging
 * - OWASP A09:2025 (Security Logging): Safe error handling
 * - OWASP A06:2025 (Authentication): Proper auth header handling
 */

import { validateProxyUrl } from '@/features/api-explorer/utils/proxy-validator';
import { REQUEST_TIMEOUT_MS } from '@/lib/constants';

export interface ApiRequestData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: string | FormData;
  auth?: {
    type: 'none' | 'api-key' | 'bearer' | 'basic';
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface ApiResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
  size: number;
}

export async function executeApiRequest(request: ApiRequestData): Promise<ApiResponseData> {
  const startTime = Date.now();

  // Mitigation for OWASP A09:2025 - SSRF Prevention
  // Validate URL before making any requests
  const validation = await validateProxyUrl(request.url);
  if (!validation.valid) {
    throw new Error(`Invalid URL: ${validation.error}`);
  }

  try {
    // Build headers with auth
    const headers = new Headers(request.headers);

    // If body is FormData, let fetch handle the Content-Type (with boundary)
    if (request.body instanceof FormData) {
      headers.delete('content-type');
    }

    // Mitigation for OWASP A06:2025 - Authentication
    // Properly construct authentication headers
    if (request.auth?.type === 'bearer' && request.auth.token) {
      headers.set('Authorization', `Bearer ${request.auth.token}`);
    } else if (request.auth?.type === 'api-key' && request.auth.apiKey) {
      headers.set('X-API-Key', request.auth.apiKey);
    } else if (request.auth?.type === 'basic' && request.auth.username && request.auth.password) {
      const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
      headers.set('Authorization', `Basic ${credentials}`);
    }

    // Make the actual request
    // Mitigation for OWASP A04:2025 - Insecure Design
    // Set reasonable timeout to prevent hanging requests
    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? (request.body as any)
        : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const time = Date.now() - startTime;

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body based on content-type
    let body: any;
    const contentType = response.headers.get('content-type') || '';

    // Match application/json and JSON-based subtypes:
    // application/problem+json (RFC 7807), application/vnd.api+json (JSON:API),
    // application/hal+json, etc.
    if (contentType.includes('json')) {
      body = await response.json();
    } else if (isBinaryContentType(contentType)) {
      // Only treat truly binary types as binary (images, octet-stream, etc.)
      body = {
        type: contentType,
        message: 'Binary response (use Download to save)',
      };
    } else {
      // Everything else: read as text (text/*, application/xml, empty content-type, errors, etc.)
      const text = await response.text();

      // If content-type is missing/empty, try parsing as JSON (many APIs omit content-type on errors)
      if (!contentType && text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      } else {
        body = text;
      }
    }

    // Calculate response size
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const size = new Blob([bodyStr]).size / 1024; // KB

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      time,
      size,
    };
  } catch (error: any) {
    // Mitigation for OWASP A09:2025 - Security Logging
    // Log errors safely without exposing sensitive data
    console.error('[API Proxy] Request failed:', {
      url: request.url,
      method: request.method,
      error: error.message,
    });

    // Return safe error to client
    if (error.name === 'AbortError') {
      throw new Error('Request timeout (30s exceeded)');
    }

    throw new Error(error.message || 'Request failed');
  }
}

/**
 * Check if a content-type represents truly binary data that can't be displayed as text.
 * Only these types get the "Binary response" placeholder — everything else is read as text.
 */
function isBinaryContentType(contentType: string): boolean {
  if (!contentType) return false;
  return (
    contentType.startsWith('image/') ||
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    contentType.includes('octet-stream') ||
    contentType.startsWith('font/') ||
    contentType.includes('application/zip') ||
    contentType.includes('application/gzip') ||
    contentType.includes('application/pdf')
  );
}
