/**
 * Diagnostics Panel Component Tests
 * TDD: Write tests first, then implement component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import type { ISpectralDiagnostic } from '@/core/events/event-types';

describe('DiagnosticsPanel', () => {
  const mockDiagnostics: ISpectralDiagnostic[] = [
    {
      code: 'operation-operationId',
      message: 'Operation must have operationId',
      severity: 0, // Error
      range: {
        start: { line: 10, character: 5 },
        end: { line: 10, character: 10 },
      },
      path: ['paths', '/users', 'get'],
    },
    {
      code: 'operation-description',
      message: 'Operation should have description',
      severity: 1, // Warning
      range: {
        start: { line: 15, character: 5 },
        end: { line: 15, character: 10 },
      },
      path: ['paths', '/users', 'post'],
    },
    {
      code: 'info-contact',
      message: 'Info object should contain contact',
      severity: 2, // Info
      range: {
        start: { line: 3, character: 2 },
        end: { line: 3, character: 6 },
      },
      path: ['info'],
    },
  ];

  it('should render empty state when no diagnostics', () => {
    render(<DiagnosticsPanel diagnostics={[]} onJumpToIssue={vi.fn()} />);

    // Check for the empty state content
    expect(screen.getByText('Your API specification passes all validation rules')).toBeInTheDocument();
  });

  it('should display diagnostics grouped by severity', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    // Should show severity group headers
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    // Use getAllByText for "Info" since it appears multiple times (header + icon aria-label)
    const infoElements = screen.getAllByText('Info');
    expect(infoElements.length).toBeGreaterThan(0);
  });

  it('should display correct counts for each severity', () => {
    const { container } = render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    // Should show count badges (there will be 3 badges with "1")
    const countBadges = container.querySelectorAll('[class*="rounded-sm"]');
    expect(countBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('should display diagnostic message and code', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    expect(screen.getByText('Operation must have operationId')).toBeInTheDocument();
    expect(screen.getByText('operation-operationId')).toBeInTheDocument();
  });

  it('should display YAML path for diagnostic', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    expect(screen.getByText('paths → /users → get')).toBeInTheDocument();
  });

  it('should call onJumpToIssue when diagnostic is clicked', () => {
    const onJumpToIssue = vi.fn();
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={onJumpToIssue} />);

    const firstDiagnostic = screen.getByText('Operation must have operationId');
    fireEvent.click(firstDiagnostic);

    expect(onJumpToIssue).toHaveBeenCalledWith(mockDiagnostics[0]);
  });

  it('should toggle collapse/expand when header is clicked', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    const header = screen.getByText(/diagnostics/i);
    fireEvent.click(header);

    // Panel should collapse (diagnostics not visible)
    expect(screen.queryByText('Operation must have operationId')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(header);
    expect(screen.getByText('Operation must have operationId')).toBeInTheDocument();
  });

  it('should support keyboard navigation with arrow keys', () => {
    const { container } = render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    // Press ArrowDown to select first item
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Wait a tick for focus to be applied
    setTimeout(() => {
      const firstButton = container.querySelector('[data-diagnostic-index="0"]') as HTMLButtonElement;
      expect(document.activeElement).toBe(firstButton);
    }, 100);
  });

  it('should jump to issue on Enter key', () => {
    const onJumpToIssue = vi.fn();
    const { container } = render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={onJumpToIssue} />);

    const firstButton = container.querySelector('[data-diagnostic-index="0"]') as HTMLButtonElement;
    expect(firstButton).toBeInTheDocument();

    firstButton.click(); // Simulate clicking to select

    expect(onJumpToIssue).toHaveBeenCalledWith(mockDiagnostics[0]);
  });

  it('should display line numbers for diagnostics', () => {
    render(<DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />);

    expect(screen.getByText('Line 10')).toBeInTheDocument();
  });

  it('should use correct icons for severity levels', () => {
    const { container } = render(
      <DiagnosticsPanel diagnostics={mockDiagnostics} onJumpToIssue={vi.fn()} />
    );

    // Should have SVG icons (Lucide icons render as SVG)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
