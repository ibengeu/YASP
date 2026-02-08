import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterProvider } from '../openrouter-provider';

describe('OpenRouterProvider', () => {
  let provider: OpenRouterProvider;

  beforeEach(() => {
    provider = new OpenRouterProvider('test-key');
    global.fetch = vi.fn();
  });

  it('should generate quick fix with valid response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            originalCode: 'wrong: value',
            fixedCode: 'correct: value',
            explanation: 'Fixed the value',
            confidence: 'high',
          }),
        },
      }],
      usage: { total_tokens: 150 },
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await provider.generateQuickFix({
      diagnostic: {
        code: 'test-rule',
        message: 'Test error',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        path: ['paths', '/test'],
        severity: 0,
      },
      specContent: 'openapi: 3.1.0',
      context: { path: ['paths'], currentValue: {} },
    });

    expect(result.fixedCode).toBe('correct: value');
    expect(result.confidence).toBe('high');
  });

  it('should throw error on API failure', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(provider.generateQuickFix({
      diagnostic: {
        code: 'test-rule',
        message: 'Test error',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        path: ['paths', '/test'],
        severity: 0,
      } as any,
      specContent: '',
      context: { path: [], currentValue: null },
    })).rejects.toThrow('API authentication failed');
  });

  it('should throw error if API key is missing', () => {
    expect(() => new OpenRouterProvider('')).toThrow('OpenRouter API key not configured');
  });

  it('should handle malformed JSON response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Not JSON at all',
          },
        }],
      }),
    });

    await expect(provider.generateQuickFix({
      diagnostic: {
        code: 'test-rule',
        message: 'Test error',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        path: ['paths'],
        severity: 0,
      } as any,
      specContent: '',
      context: { path: [], currentValue: null },
    })).rejects.toThrow('No JSON found in response');
  });
});
