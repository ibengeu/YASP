/**
 * Desktop Spec Fetch Action
 * Fetches OpenAPI specifications from external URLs via the Tauri Rust backend.
 * Bypasses browser CORS without needing a server — Rust makes the request directly.
 *
 * Security:
 * - OWASP A09:2025 (SSRF): URL validation performed in Rust command (see commands/mod.rs)
 * - OWASP A04:2025 (Insecure Design): 5MB response limit enforced in Rust
 * - OWASP A05:2025 (Cryptographic Failures): TLS enforced via reqwest + rustls
 */

import { invoke } from '@tauri-apps/api/core';

export interface FetchSpecResult {
    content?: string;
    error?: string;
}

/**
 * Fetch an OpenAPI specification from a URL via the Tauri Rust backend.
 * Replaces the web app's fetch-to-/api/fetch-spec call.
 *
 * OWASP A09:2025 – SSRF: All URL validation happens in the Rust command,
 * not in JS, preventing client-side bypass.
 */
export async function fetchSpec(url: string): Promise<FetchSpecResult> {
    if (!url || typeof url !== 'string') {
        return { error: 'Missing or invalid URL' };
    }

    try {
        // invoke throws on Rust Err() — the Rust command returns Result<String, String>
        const content = await invoke<string>('fetch_spec', { url });
        return { content };
    } catch (error: unknown) {
        const message = typeof error === 'string'
            ? error
            : error instanceof Error
                ? error.message
                : 'Failed to fetch specification';
        return { error: message };
    }
}
