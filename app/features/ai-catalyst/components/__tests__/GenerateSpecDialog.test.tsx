/**
 * Generate Spec Dialog Tests
 * AI-powered OpenAPI spec generation UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerateSpecDialog } from '../GenerateSpecDialog';

describe('GenerateSpecDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(
        <GenerateSpecDialog
          open={false}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      expect(screen.queryByText('Generate API Specification')).not.toBeInTheDocument();
    });

    it('should render dialog when open', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      expect(screen.getByText('Generate API Specification')).toBeInTheDocument();
      expect(screen.getByText(/Describe the API you want to create/)).toBeInTheDocument();
    });

    it('should display prompt textarea', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('rows', '6');
    });

    it('should display generate button', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      expect(screen.getByRole('button', { name: /Generate Spec/i })).toBeInTheDocument();
    });

    it('should display cancel button', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should display AI provider info', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      expect(screen.getByText(/Powered by Groq/)).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should update prompt on textarea change', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Create a blog API' } });

      expect(textarea).toHaveValue('Create a blog API');
    });

    it('should call onClose when cancel button clicked', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should disable generate button when prompt is empty', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      const generateBtn = screen.getByRole('button', { name: /Generate Spec/i });
      expect(generateBtn).toBeDisabled();
    });

    it('should enable generate button when prompt has content', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Create blog API' } });

      const generateBtn = screen.getByRole('button', { name: /Generate Spec/i });
      expect(generateBtn).not.toBeDisabled();
    });
  });

  describe('generation states', () => {
    it('should show loading state during generation', async () => {
      // Mock a slow API response
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                choices: [{ message: { content: 'openapi: 3.1.0' } }],
                usage: { total_tokens: 100 },
              }),
            } as Response);
          }, 100);
        })
      );

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Create blog API' } });

      const generateBtn = screen.getByRole('button', { name: /Generate Spec/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Generating/)).toBeInTheDocument();
      });
    });

    it('should show generated spec in preview', async () => {
      const mockSpec = 'openapi: 3.1.0\ninfo:\n  title: Blog API';

      // Mock AI provider response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockSpec } }],
          usage: { total_tokens: 150 },
        }),
      } as Response);

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Create blog API' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByText(/Generated Specification/)).toBeInTheDocument();
        expect(screen.getByText(/Blog API/)).toBeInTheDocument();
      });
    });

    it('should show error message on generation failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('API error'));

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Create blog API' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate specification/)).toBeInTheDocument();
      });
    });

    it('should show provider info when failover occurs', async () => {
      // Mock Groq failure, Gemini success
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Groq error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'openapi: 3.1.0' }] } }],
            usageMetadata: { totalTokenCount: 100 },
          }),
        } as Response);

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
          geminiApiKey="test-gemini-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Test' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByText(/Generated by Gemini/)).toBeInTheDocument();
      });
    });
  });

  describe('actions with generated spec', () => {
    it('should display import button after generation', async () => {
      const mockSpec = 'openapi: 3.1.0\ninfo:\n  title: Test API';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockSpec } }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Test' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Import to Library/i })).toBeInTheDocument();
      });
    });

    it('should call onGenerated when import button clicked', async () => {
      const mockSpec = 'openapi: 3.1.0\ninfo:\n  title: Test API';

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockSpec } }],
          usage: { total_tokens: 100 },
        }),
      } as Response);

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Test' } });

      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Import to Library/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Import to Library/i }));

      expect(mockOnGenerated).toHaveBeenCalledWith(mockSpec);
    });

    it('should allow regenerating with new prompt', async () => {
      const mockSpec1 = 'openapi: 3.1.0\ninfo:\n  title: First API';
      const mockSpec2 = 'openapi: 3.1.0\ninfo:\n  title: Second API';

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: mockSpec1 } }],
            usage: { total_tokens: 100 },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: mockSpec2 } }],
            usage: { total_tokens: 120 },
          }),
        } as Response);

      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      // First generation
      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'First API' } });
      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByText(/First API/)).toBeInTheDocument();
      });

      // Click "Generate New" button to reset
      fireEvent.click(screen.getByRole('button', { name: /Generate New/i }));

      // Regenerate with new prompt
      fireEvent.change(textarea, { target: { value: 'Second API' } });
      fireEvent.click(screen.getByRole('button', { name: /Generate Spec/i }));

      await waitFor(() => {
        expect(screen.getByText(/Second API/)).toBeInTheDocument();
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should close dialog on Escape key', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should generate on Cmd+Enter when prompt is filled', () => {
      render(
        <GenerateSpecDialog
          open={true}
          onClose={mockOnClose}
          onGenerated={mockOnGenerated}
          groqApiKey="test-key"
        />
      );

      const textarea = screen.getByPlaceholderText(/Create a REST API for user management/);
      fireEvent.change(textarea, { target: { value: 'Test' } });

      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

      expect(screen.getByText(/Generating/)).toBeInTheDocument();
    });
  });
});
