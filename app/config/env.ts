// Mitigation for OWASP A05:2025 - Cryptographic Failures
// Store API keys securely in environment variables
export const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY ||
  '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';
