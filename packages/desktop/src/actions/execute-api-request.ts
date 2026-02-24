/**
 * Desktop API Request Action
 * Executes API requests via Tauri's invoke() bridge instead of a server route.
 *
 * Security:
 * - OWASP A09:2025 (SSRF): URL validation performed in Rust command (see commands/mod.rs)
 * - OWASP A04:2025 (Insecure Design): 30s timeout, 10MB body limit enforced in Rust
 * - OWASP A05:2025 (Cryptographic Failures): TLS enforced via reqwest + rustls
 *
 * This module re-exports the same ApiRequestData/ApiResponseData types as the web
 * action so components from @yasp/core can be used unchanged.
 */

import { invoke } from '@tauri-apps/api/core';

import type { ApiRequestData, ApiResponseData } from '@yasp/core/actions/execute-api-request';
export type { ApiRequestData, ApiResponseData };

interface TauriApiResponse {
    status: number;
    status_text: string;
    headers: Record<string, string>;
    body: string;
    duration_ms: number;
}

/**
 * Execute an API request via the Tauri Rust backend.
 * Replaces the web app's fetch-to-/api/execute-request call.
 *
 * OWASP A09:2025 – SSRF: All URL validation happens in the Rust command,
 * not in JS, preventing client-side bypass.
 */
export async function executeApiRequest(request: ApiRequestData): Promise<ApiResponseData> {
    const startTime = Date.now();

    // Serialize body: FormData is not supported via invoke — convert to plain object
    let bodyStr: string | undefined;
    if (request.body instanceof FormData) {
        const obj: Record<string, string> = {};
        request.body.forEach((value: FormDataEntryValue, key: string) => {
            obj[key] = String(value);
        });
        bodyStr = JSON.stringify(obj);
    } else {
        bodyStr = request.body;
    }

    // Build headers with auth applied
    const headers: Record<string, string> = { ...request.headers };

    // OWASP A06:2025 – Identification and Authentication Failures:
    // Auth headers constructed in JS, then sent to Rust — Rust does not handle auth logic
    if (request.auth?.type === 'bearer' && request.auth.token) {
        headers['Authorization'] = `Bearer ${request.auth.token}`;
    } else if (request.auth?.type === 'api-key' && request.auth.apiKey) {
        headers['X-API-Key'] = request.auth.apiKey;
    } else if (request.auth?.type === 'basic' && request.auth.username && request.auth.password) {
        const credentials = btoa(`${request.auth.username}:${request.auth.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await invoke<TauriApiResponse>('execute_api_request', {
        method: request.method,
        url: request.url,
        headers,
        body: bodyStr ?? null,
    });

    const time = Date.now() - startTime;

    // Parse body: try JSON first, fall back to text
    let body: unknown;
    const contentType = response.headers['content-type'] ?? '';
    if (contentType.includes('json')) {
        try {
            body = JSON.parse(response.body);
        } catch {
            body = response.body;
        }
    } else {
        body = response.body;
    }

    const bodyStr2 = typeof body === 'string' ? body : JSON.stringify(body);
    const size = new Blob([bodyStr2]).size / 1024; // KB

    return {
        status: response.status,
        statusText: response.status_text,
        headers: response.headers,
        body,
        time,
        size,
    };
}
