/**
 * Tests for RegisterApiDrawer (Wizard-based V3)
 * Smoke tests for the 3-step wizard flow: Spec Upload → Basic Info → Review
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegisterApiDrawer } from '@/components/registration/RegisterApiDrawer';

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

vi.mock('@/core/storage/idb-storage', () => ({
  idbStorage: {
    createSpec: vi.fn().mockResolvedValue({ id: 'test-id' }),
  },
}));

describe('RegisterApiDrawer - Wizard V3', () => {
  it('should render when open', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Register New API')).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <RegisterApiDrawer
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText('Register New API')).not.toBeInTheDocument();
  });

  it('should show 3-step progress indicator', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Verify step description is shown
    expect(screen.getByText(/Provide your OpenAPI spec to auto-fill API details/i)).toBeInTheDocument();
  });

  it('should display spec upload options on Step 1', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Check for tab options - tabs are labeled "File", "Paste", "URL"
    expect(screen.getByRole('tab', { name: /File/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Paste/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /URL/i })).toBeInTheDocument();
  });

  it('should have a Next button on Step 1', () => {
    render(
      <RegisterApiDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Should have a button to proceed - text includes next step name
    const nextButton = screen.getByRole('button', { name: /Basic Information/i });
    expect(nextButton).toBeInTheDocument();
  });
});
