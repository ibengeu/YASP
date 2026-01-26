/**
 * AI Provider Service Tests
 * Groq + Gemini integration with circuit breaker failover
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIProvider, AIProviderOptions, GenerateSpecRequest, GenerateSpecResponse } from '../ai-provider';
import { CircuitBreakerState } from '../circuit-breaker';

describe('AIProvider', () => {
  let aiProvider: AIProvider;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();

    aiProvider = new AIProvider({
      groqApiKey: 'test-groq-key',
      geminiApiKey: 'test-gemini-key',
      circuitBreakerOptions: {
        failureThreshold: 3,
        resetTimeout: 100, // Fast timeout for tests
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with Groq as primary provider', () => {
      expect(aiProvider.getPrimaryProvider()).toBe('groq');
      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.CLOSED);
      expect(aiProvider.getCircuitState('gemini')).toBe(CircuitBreakerState.CLOSED);
    });

    it('should throw error if no API keys provided', () => {
      expect(() => {
        new AIProvider({
          groqApiKey: '',
          geminiApiKey: '',
        });
      }).toThrow('At least one API key must be provided');
    });

    it('should allow single provider initialization', () => {
      const groqOnly = new AIProvider({
        groqApiKey: 'test-groq-key',
        geminiApiKey: '',
      });
      expect(groqOnly.getPrimaryProvider()).toBe('groq');
    });
  });

  describe('generateSpec - Groq primary', () => {
    it('should call Groq API with correct parameters', async () => {
      const mockResponse: GenerateSpecResponse = {
        yamlSpec: 'openapi: 3.1.0\ninfo:\n  title: Test API',
        provider: 'groq',
        tokensUsed: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: mockResponse.yamlSpec,
            },
          }],
          usage: {
            total_tokens: 150,
          },
        }),
      } as Response);

      const request: GenerateSpecRequest = {
        prompt: 'Create a REST API for user management',
      };

      const result = await aiProvider.generateSpec(request);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-groq-key',
          },
          body: expect.stringContaining(request.prompt),
        })
      );
    });

    it('should include system prompt for OpenAPI generation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'openapi: 3.1.0' } }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      await aiProvider.generateSpec({ prompt: 'Test' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages).toHaveLength(2);
      expect(callBody.messages[0].role).toBe('system');
      expect(callBody.messages[0].content).toContain('OpenAPI 3.1');
      expect(callBody.messages[1].role).toBe('user');
      expect(callBody.messages[1].content).toBe('Test');
    });

    it('should use llama-3.3-70b-versatile model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'spec' } }],
          usage: { total_tokens: 50 },
        }),
      } as Response);

      await aiProvider.generateSpec({ prompt: 'Test' });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('generateSpec - automatic failover', () => {
    it('should failover to Gemini when Groq circuit opens', async () => {
      // Fail Groq 3 times to open circuit
      // But let Gemini succeed so it stays closed
      mockFetch
        // First attempt: Groq fails, Gemini succeeds
        .mockRejectedValueOnce(new Error('Groq API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response)
        // Second attempt: Groq fails, Gemini succeeds
        .mockRejectedValueOnce(new Error('Groq API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response)
        // Third attempt: Groq fails, Gemini succeeds
        .mockRejectedValueOnce(new Error('Groq API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response);

      for (let i = 0; i < 3; i++) {
        const result = await aiProvider.generateSpec({ prompt: 'Test' });
        expect(result.provider).toBe('gemini'); // Should already be using Gemini
      }

      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.OPEN);

      // Next call should use Gemini
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'openapi: 3.1.0\ninfo:\n  title: Fallback API' }],
            },
          }],
          usageMetadata: {
            totalTokenCount: 200,
          },
        }),
      } as Response);

      const result = await aiProvider.generateSpec({ prompt: 'Test' });

      expect(result.provider).toBe('gemini');
      expect(result.yamlSpec).toContain('Fallback API');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object)
      );
    });

    it('should throw error when all providers fail', async () => {
      // Open Groq circuit - 3 failures
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      // Open Gemini circuit - 3 more failures
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.OPEN);
      expect(aiProvider.getCircuitState('gemini')).toBe(CircuitBreakerState.OPEN);

      await expect(aiProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('All AI providers are unavailable');
    });

    it('should recover to Groq when circuit closes', async () => {
      // Open Groq circuit
      mockFetch
        .mockRejectedValueOnce(new Error('Groq error'))
        .mockRejectedValueOnce(new Error('Groq error'))
        .mockRejectedValueOnce(new Error('Groq error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.OPEN);

      // Wait for half-open transition
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.HALF_OPEN);

      // Successful call should close circuit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'openapi: 3.1.0' } }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      const result = await aiProvider.generateSpec({ prompt: 'Test' });

      expect(result.provider).toBe('groq');
      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('generateSpec - Gemini integration', () => {
    it('should call Gemini API with correct parameters', async () => {
      // Open Groq to force Gemini usage, but let Gemini succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Groq down'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response)
        .mockRejectedValueOnce(new Error('Groq down'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response)
        .mockRejectedValueOnce(new Error('Groq down'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 50 },
          }),
        } as Response);

      // Warm up to open Groq circuit (but Gemini succeeds)
      for (let i = 0; i < 3; i++) {
        await aiProvider.generateSpec({ prompt: 'Test' });
      }

      // Now mock successful Gemini call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'openapi: 3.1.0\ninfo:\n  title: Gemini API' }],
            },
          }],
          usageMetadata: {
            totalTokenCount: 250,
          },
        }),
      } as Response);

      const request: GenerateSpecRequest = {
        prompt: 'Create API for payments',
      };

      const result = await aiProvider.generateSpec(request);

      expect(result).toEqual({
        yamlSpec: 'openapi: 3.1.0\ninfo:\n  title: Gemini API',
        provider: 'gemini',
        tokensUsed: 250,
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining(request.prompt),
        })
      );
    });

    it('should use gemini-2.0-flash-exp model', async () => {
      // Force Gemini usage
      aiProvider = new AIProvider({
        groqApiKey: '',
        geminiApiKey: 'test-gemini-key',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'spec' }] } }],
          usageMetadata: { totalTokenCount: 50 },
        }),
      } as Response);

      await aiProvider.generateSpec({ prompt: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-2.0-flash-exp'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    let groqOnlyProvider: AIProvider;

    beforeEach(() => {
      // Create provider with only Groq to isolate error handling
      groqOnlyProvider = new AIProvider({
        groqApiKey: 'test-groq-key',
        geminiApiKey: '',
        circuitBreakerOptions: {
          failureThreshold: 3,
          resetTimeout: 100,
        },
      });
    });

    it('should handle HTTP 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      } as Response);

      await expect(groqOnlyProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should handle HTTP 401 authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(groqOnlyProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('Invalid API key');
    });

    it('should handle HTTP 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(groqOnlyProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('Provider server error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(groqOnlyProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('Network failure');
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing required fields
      } as Response);

      await expect(groqOnlyProvider.generateSpec({ prompt: 'Test' }))
        .rejects.toThrow('Invalid API response format');
    });
  });

  describe('quota management', () => {
    it('should track token usage across requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'spec1' } }],
            usage: { total_tokens: 100 },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'spec2' } }],
            usage: { total_tokens: 150 },
          }),
        } as Response);

      await aiProvider.generateSpec({ prompt: 'Test 1' });
      await aiProvider.generateSpec({ prompt: 'Test 2' });

      const usage = aiProvider.getTokenUsage();
      expect(usage.totalTokens).toBe(250);
      expect(usage.requestCount).toBe(2);
    });

    it('should reset token usage on reset', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'spec' } }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      await aiProvider.generateSpec({ prompt: 'Test' });
      expect(aiProvider.getTokenUsage().totalTokens).toBe(100);

      aiProvider.resetTokenUsage();
      expect(aiProvider.getTokenUsage().totalTokens).toBe(0);
      expect(aiProvider.getTokenUsage().requestCount).toBe(0);
    });
  });

  describe('manual provider control', () => {
    it('should allow manual circuit breaker reset', async () => {
      // Open Groq circuit
      mockFetch
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.OPEN);

      aiProvider.resetCircuit('groq');
      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.CLOSED);
    });

    it('should allow resetting all circuits', async () => {
      // Open Groq circuit - 3 failures
      mockFetch
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      // Open Gemini circuit - 3 more failures
      mockFetch
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'))
        .mockRejectedValueOnce(new Error('Error'));

      for (let i = 0; i < 3; i++) {
        try {
          await aiProvider.generateSpec({ prompt: 'Test' });
        } catch {}
      }

      aiProvider.resetAllCircuits();
      expect(aiProvider.getCircuitState('groq')).toBe(CircuitBreakerState.CLOSED);
      expect(aiProvider.getCircuitState('gemini')).toBe(CircuitBreakerState.CLOSED);
    });
  });
});
