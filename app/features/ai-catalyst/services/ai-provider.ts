/**
 * AI Provider Service
 * Groq + Gemini integration with automatic failover
 *
 * Pattern: Primary (Groq) → Fallback (Gemini)
 * Uses circuit breaker for automatic failover on provider failures
 */

import { CircuitBreaker, CircuitBreakerOptions, CircuitBreakerState } from './circuit-breaker';

export type AIProviderType = 'groq' | 'gemini';

export interface AIProviderOptions {
  groqApiKey: string;
  geminiApiKey: string;
  circuitBreakerOptions?: CircuitBreakerOptions;
}

export interface GenerateSpecRequest {
  prompt: string;
}

export interface GenerateSpecResponse {
  yamlSpec: string;
  provider: AIProviderType;
  tokensUsed: number;
}

interface TokenUsage {
  totalTokens: number;
  requestCount: number;
}

/**
 * System prompt for OpenAPI 3.1 specification generation
 * OWASP A03:2025 - Injection: Controlled system prompt prevents prompt injection
 */
const SYSTEM_PROMPT = `You are an OpenAPI 3.1 specification generator. Generate valid YAML specs.

Rules:
1. Use OpenAPI 3.1.0 format
2. Include complete schemas in components/schemas
3. Add example values for all fields
4. Use standard HTTP status codes (200, 201, 400, 401, 404, 500)
5. Include security schemes (bearer, apiKey, oauth2)
6. Add descriptions to all endpoints and schemas
7. Output ONLY valid YAML (no markdown, no explanations)`;

export class AIProvider {
  private groqApiKey: string;
  private geminiApiKey: string;
  private groqCircuit: CircuitBreaker | null = null;
  private geminiCircuit: CircuitBreaker | null = null;
  private tokenUsage: TokenUsage = { totalTokens: 0, requestCount: 0 };

  constructor(options: AIProviderOptions) {
    // OWASP A06:2025 - Identification and Authentication Failures: Validate API keys
    if (!options.groqApiKey && !options.geminiApiKey) {
      throw new Error('At least one API key must be provided');
    }

    this.groqApiKey = options.groqApiKey;
    this.geminiApiKey = options.geminiApiKey;

    const circuitOptions = options.circuitBreakerOptions || {
      failureThreshold: 3,
      resetTimeout: 5000,
    };

    // Initialize circuit breakers for available providers
    if (this.groqApiKey) {
      this.groqCircuit = new CircuitBreaker(circuitOptions);
    }
    if (this.geminiApiKey) {
      this.geminiCircuit = new CircuitBreaker(circuitOptions);
    }
  }

  /**
   * Get primary provider (Groq preferred)
   */
  getPrimaryProvider(): AIProviderType {
    return this.groqApiKey ? 'groq' : 'gemini';
  }

  /**
   * Get circuit breaker state for a provider
   */
  getCircuitState(provider: AIProviderType): CircuitBreakerState {
    const circuit = provider === 'groq' ? this.groqCircuit : this.geminiCircuit;
    if (!circuit) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    return circuit.getState();
  }

  /**
   * Generate OpenAPI specification using AI
   */
  async generateSpec(request: GenerateSpecRequest): Promise<GenerateSpecResponse> {
    let lastError: Error | null = null;

    // Try primary provider (Groq) first if available and circuit is not open
    if (this.groqCircuit && this.groqCircuit.getState() !== CircuitBreakerState.OPEN) {
      try {
        return await this.groqCircuit.execute(() =>
          this.callGroqAPI(request.prompt)
        );
      } catch (error) {
        // Circuit breaker will handle state transitions
        // Save error and fall through to try Gemini
        lastError = error as Error;
      }
    }

    // Fallback to Gemini if Groq failed or is not available
    if (this.geminiCircuit && this.geminiCircuit.getState() !== CircuitBreakerState.OPEN) {
      try {
        return await this.geminiCircuit.execute(() =>
          this.callGeminiAPI(request.prompt)
        );
      } catch (error) {
        // Both providers failed, throw the Gemini error
        throw error;
      }
    }

    // All providers unavailable or circuits open
    if (lastError) {
      // Re-throw the last error if we have one
      throw lastError;
    }

    throw new Error('All AI providers are unavailable');
  }

  /**
   * Call Groq API for spec generation
   * Uses llama-3.3-70b-versatile model
   */
  private async callGroqAPI(prompt: string): Promise<GenerateSpecResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      // OWASP A08:2025 - Security Logging: Log API errors for monitoring
      const errorMessage = this.getErrorMessage(response.status);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Validate response format
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    const yamlSpec = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Track token usage
    this.tokenUsage.totalTokens += tokensUsed;
    this.tokenUsage.requestCount += 1;

    return {
      yamlSpec,
      provider: 'groq',
      tokensUsed,
    };
  }

  /**
   * Call Gemini API for spec generation
   * Uses gemini-2.0-flash-exp model
   */
  private async callGeminiAPI(prompt: string): Promise<GenerateSpecResponse> {
    const model = 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorMessage = this.getErrorMessage(response.status);
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Validate response format
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }

    const yamlSpec = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

    // Track token usage
    this.tokenUsage.totalTokens += tokensUsed;
    this.tokenUsage.requestCount += 1;

    return {
      yamlSpec,
      provider: 'gemini',
      tokensUsed,
    };
  }

  /**
   * Get user-friendly error message based on HTTP status
   * OWASP A05:2025 - Cryptographic Failures: Safe error messages that don't expose internals
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return 'Invalid API key';
      case 429:
        return 'Rate limit exceeded';
      case 500:
      case 502:
      case 503:
        return 'Provider server error';
      default:
        return `API request failed with status ${status}`;
    }
  }

  /**
   * Get current token usage statistics
   */
  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  /**
   * Reset token usage tracking
   */
  resetTokenUsage(): void {
    this.tokenUsage = { totalTokens: 0, requestCount: 0 };
  }

  /**
   * Manually reset a circuit breaker
   */
  resetCircuit(provider: AIProviderType): void {
    const circuit = provider === 'groq' ? this.groqCircuit : this.geminiCircuit;
    if (!circuit) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    circuit.reset();
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuits(): void {
    this.groqCircuit?.reset();
    this.geminiCircuit?.reset();
  }
}
