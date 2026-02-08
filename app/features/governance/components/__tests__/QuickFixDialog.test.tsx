import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickFixDialog } from '../QuickFixDialog';

describe('QuickFixDialog', () => {
  const mockDiagnostic = {
    code: 'oas3-schema',
    message: 'Schema is invalid',
    range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
    path: ['components', 'schemas'],
    severity: 0 as const,
  };

  const mockQuickFix = {
    originalCode: 'type: invalid',
    fixedCode: 'type: string',
    explanation: 'Changed type to valid string',
    confidence: 'high' as const,
    tokensUsed: 100,
  };

  it('should not render when closed', () => {
    const { container } = render(
      <QuickFixDialog
        open={false}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={null}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render loading state', () => {
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={null}
        isLoading={true}
        onAccept={vi.fn()}
      />
    );

    expect(screen.getByText('Generating fix with AI...')).toBeInTheDocument();
  });

  it('should display diff view', () => {
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    expect(screen.getByText('type: invalid')).toBeInTheDocument();
    expect(screen.getByText('type: string')).toBeInTheDocument();
    expect(screen.getByText('Changed type to valid string')).toBeInTheDocument();
  });

  it('should call onAccept when Apply Fix clicked', () => {
    const onAccept = vi.fn();
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={onAccept}
      />
    );

    fireEvent.click(screen.getByText('Apply Fix'));
    expect(onAccept).toHaveBeenCalled();
  });

  it('should call onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(
      <QuickFixDialog
        open={true}
        onClose={onClose}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <QuickFixDialog
        open={true}
        onClose={onClose}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    const backdrop = container.querySelector('.absolute.inset-0.bg-black\\/60');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should display diagnostic message', () => {
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    expect(screen.getByText('Schema is invalid')).toBeInTheDocument();
    expect(screen.getByText('oas3-schema')).toBeInTheDocument();
  });

  it('should display confidence badge', () => {
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={mockQuickFix}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('should not show Apply button when loading', () => {
    const { queryByRole } = render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={null}
        isLoading={true}
        onAccept={vi.fn()}
      />
    );

    // Look for all buttons and ensure none have "Apply Fix" text
    const buttons = queryByRole('button', { name: /Apply Fix/i });
    expect(buttons).not.toBeInTheDocument();
  });

  it('should show failed state when no fix and not loading', () => {
    render(
      <QuickFixDialog
        open={true}
        onClose={vi.fn()}
        diagnostic={mockDiagnostic}
        quickFix={null}
        isLoading={false}
        onAccept={vi.fn()}
      />
    );

    expect(screen.getByText('Failed to generate fix')).toBeInTheDocument();
  });
});
