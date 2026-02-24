/**
 * Tests for RegisterApiDrawer (2-step wizard)
 * Smoke tests for the 2-step wizard flow: Details → Preview
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterApiDrawer } from '@yasp/core/components/registration/RegisterApiDrawer';

// Mock pointer capture methods for vaul drawer (jsdom doesn't support these)
beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn();
  vi.clearAllMocks();
});

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@yasp/core/core/storage/idb-storage', () => ({
  idbStorage: {
    createSpec: vi.fn().mockResolvedValue({ id: 'test-id' }),
  },
}));

describe('RegisterApiDrawer', () => {
  it('should render when open', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Add an API')).toBeInTheDocument();
    expect(screen.getByText(/Upload your API spec and fill in the details/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <RegisterApiDrawer
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText('Add an API')).not.toBeInTheDocument();
  });

  it('should show step 1 description', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Upload your API spec and fill in the details/i)).toBeInTheDocument();
  });

  it('should display spec upload options on Step 1', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Check for tab options
    expect(screen.getByRole('tab', { name: /File/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Paste/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /URL/i })).toBeInTheDocument();
  });

  it('should have a Preview button on Step 1', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const nextButton = screen.getByRole('button', { name: /Preview/i });
    expect(nextButton).toBeInTheDocument();
  });
});
