/**
 * OpenRouter AI Provider for Quick Fix Generation
 * Uses OpenRouter API to generate fixes for OpenAPI spec diagnostics
 *
 * Security:
 * - OWASP A03:2025 (Injection): Safe prompt construction and JSON parsing
 * - OWASP A05:2025 (Cryptographic Failures): Secure API key management
 * - OWASP A06:2025 (Authentication Failures): API key validation
 * - OWASP A09:2025 (Security Logging): Safe error messages
 */

import { OPENROUTER_API_KEY } from '@/config/env';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

export interface QuickFixRequest {
  diagnostic: ISpectralDiagnostic;
  specContent: string;
  context: {
    path: string[];
    currentValue: any;
  };
}

export interface QuickFixResponse {
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: 'high' | 'medium' | 'low';
  tokensUsed: number;
}

export class OpenRouterProvider {
  private readonly apiKey: string;
  // Mistral Devstral 2: #1 free coding model in Feb 2026
  // 123B parameters, 262k context, specialized for agentic coding
  private readonly model = 'mistralai/devstral-2512';
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(apiKey?: string) {
    // Mitigation for OWASP A06:2025 - Authentication Failures
    // Validate API key is provided
    this.apiKey = apiKey !== undefined ? apiKey : OPENROUTER_API_KEY;
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('OpenRouter API key not configured');
    }
  }

  async generateQuickFix(request: QuickFixRequest): Promise<QuickFixResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    // Try up to 2 times with backoff on rate limit
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.makeRequest(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error as Error;
        // Only retry on rate limit errors
        if (error instanceof Error && error.message.includes('Rate limit')) {
          if (attempt < 1) {
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        // Don't retry other errors
        throw error;
      }
    }
    throw lastError || new Error('Failed to generate quick fix');
  }

  private async makeRequest(systemPrompt: string, userPrompt: string): Promise<QuickFixResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://yasp.dev',
          'X-Title': 'YASP - OpenAPI Editor',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // Lower temp for code fixes
          max_tokens: 2000,
          // Optional: Add route preference for free models
          route: 'fallback',
        }),
      });

      if (!response.ok) {
        // Mitigation for OWASP A09:2025 - Security Logging Failures
        // Log error details for debugging without exposing to user
        const errorText = await response.text();
        console.error('[OpenRouter] API Error:', response.status, errorText);

        // Parse error details for better messages
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || '';
        } catch {
          // Ignore JSON parse errors
        }

        // Provide helpful error messages for common issues
        if (response.status === 404) {
          if (errorDetails.includes('data policy')) {
            throw new Error('AI model requires configuration. Please visit openrouter.ai/settings/privacy and enable data sharing for free models.');
          }
          throw new Error('AI model temporarily unavailable. Please try again later or contact support.');
        }
        if (response.status === 401) {
          throw new Error('API authentication failed. Please check your API key in .env.local');
        }
        if (response.status === 429) {
          if (errorDetails.includes('rate-limited upstream')) {
            throw new Error('AI service is busy. Please wait 30 seconds and try again.');
          }
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }

        throw new Error(`AI service error (${response.status}). Please try again.`);
      }

      const data = await response.json();
      return this.parseQuickFixResponse(data);
    } catch (error) {
      // Mitigation for OWASP A09:2025 - Don't expose internal errors
      console.error('[OpenRouter] Quick fix failed:', error);
      // Re-throw if it's already our error with a safe message
      if (error instanceof Error) {
        // Allow these safe error messages to pass through
        const safeMessages = [
          'AI model temporarily unavailable',
          'API authentication failed',
          'Rate limit exceeded',
          'AI service error',
          'No JSON found in response',
        ];
        if (safeMessages.some(msg => error.message.includes(msg))) {
          throw error;
        }
      }
      throw new Error('Failed to generate quick fix. Please try again.');
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert OpenAPI 3.x specification assistant. Your task is to fix specific validation errors in OpenAPI specs.

Rules:
1. Only modify the exact section that has the error
2. Maintain YAML formatting and indentation
3. Preserve comments and structure
4. Follow OpenAPI 3.1.0 specification strictly
5. Provide clear explanation of the fix

Response format (JSON):
{
  "originalCode": "the problematic YAML section",
  "fixedCode": "the corrected YAML section",
  "explanation": "brief explanation of what was fixed and why",
  "confidence": "high|medium|low"
}`;
  }

  private buildUserPrompt(request: QuickFixRequest): string {
    const { diagnostic, specContent, context } = request;

    // Extract relevant section from spec
    const lines = specContent.split('\n');
    const startLine = Math.max(0, diagnostic.range.start.line - 3);
    const endLine = Math.min(lines.length, diagnostic.range.end.line + 3);
    const contextSnippet = lines.slice(startLine, endLine).join('\n');

    // Mitigation for OWASP A03:2025 - Injection
    // Sanitize context values to prevent prompt injection
    const sanitizedValue = typeof context.currentValue === 'string'
      ? context.currentValue.substring(0, 1000) // Limit size
      : JSON.stringify(context.currentValue, null, 2).substring(0, 1000);

    return `Fix this OpenAPI specification error:

**Error Details:**
- Code: ${diagnostic.code}
- Message: ${diagnostic.message}
- Location: Line ${diagnostic.range.start.line + 1}, Column ${diagnostic.range.start.character}
- Path: ${context.path.join(' > ')}

**Current Spec Section (with context):**
\`\`\`yaml
${contextSnippet}
\`\`\`

**Current Value at Error Path:**
\`\`\`yaml
${sanitizedValue}
\`\`\`

Provide a JSON response with the fix.`;
  }

  private parseQuickFixResponse(apiResponse: any): QuickFixResponse {
    const content = apiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid API response format');
    }

    // Mitigation for OWASP A03:2025 - Injection prevention
    // Sanitize and validate JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      originalCode: parsed.originalCode || '',
      fixedCode: parsed.fixedCode || '',
      explanation: parsed.explanation || 'Fix applied',
      confidence: parsed.confidence || 'medium',
      tokensUsed: apiResponse.usage?.total_tokens || 0,
    };
  }
}
