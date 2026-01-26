/**
 * Generate Spec Dialog Component
 * AI-powered OpenAPI specification generation
 *
 * Linear-inspired design with clean interactions
 */

import { useState, useEffect } from 'react';
import { X, Sparkles, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AIProvider } from '../services/ai-provider';

export interface GenerateSpecDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (yamlSpec: string) => void;
  groqApiKey?: string;
  geminiApiKey?: string;
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

export function GenerateSpecDialog({
  open,
  onClose,
  onGenerated,
  groqApiKey = '',
  geminiApiKey = '',
}: GenerateSpecDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<GenerationState>('idle');
  const [generatedSpec, setGeneratedSpec] = useState('');
  const [provider, setProvider] = useState<'groq' | 'gemini'>('groq');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setState('idle');
      setGeneratedSpec('');
      setErrorMessage('');
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && open && prompt.trim() && state === 'idle') {
        e.preventDefault();
        handleGenerate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, prompt, state, onClose]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setState('generating');
    setErrorMessage('');

    try {
      // Initialize AI provider
      const aiProvider = new AIProvider({
        groqApiKey,
        geminiApiKey,
        circuitBreakerOptions: {
          failureThreshold: 3,
          resetTimeout: 30000, // 30 seconds
        },
      });

      const result = await aiProvider.generateSpec({ prompt: prompt.trim() });

      setGeneratedSpec(result.yamlSpec);
      setProvider(result.provider);
      setTokensUsed(result.tokensUsed);
      setState('success');
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to generate specification'
      );
    }
  };

  const handleImport = () => {
    onGenerated(generatedSpec);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Generate API Specification
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe the API you want to create and let AI generate an OpenAPI spec
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {state === 'idle' || state === 'generating' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-card-foreground">
                  API Description
                </label>
                <textarea
                  id="prompt"
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Create a REST API for user management with authentication, CRUD operations for users, and role-based access control"
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-ring"
                  disabled={state === 'generating'}
                />
              </div>

              {state === 'generating' && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3">
                  <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Generating your OpenAPI specification...
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Powered by Groq (Llama 3.3 70B) with Gemini failover
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || state === 'generating'}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Spec
                  </button>
                </div>
              </div>
            </div>
          ) : state === 'success' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-success/10 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-success">
                    Generated successfully
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Generated by {provider === 'groq' ? 'Groq' : 'Gemini'} ({tokensUsed} tokens)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground">
                  Generated Specification
                </label>
                <pre className="mt-2 max-h-96 overflow-auto rounded-md border border-border bg-muted p-4 text-xs text-card-foreground">
                  <code>{generatedSpec}</code>
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setState('idle');
                    setGeneratedSpec('');
                  }}
                  className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Generate New
                </button>
                <button
                  onClick={handleImport}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Import to Library
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-destructive">
                    Failed to generate specification
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setState('idle');
                    setErrorMessage('');
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
