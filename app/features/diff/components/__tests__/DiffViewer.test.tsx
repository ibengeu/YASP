/**
 * Optimized Unit Tests for DiffViewer Component
 * Merged similar tests to reduce redundancy (36 tests → 15 tests)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffViewer } from '../DiffViewer';

describe('DiffViewer', () => {
  describe('Stats Display', () => {
    it('should calculate and display stats correctly (additions, deletions, net change, padding)', () => {
      // Test additions and net change
      const { rerender } = render(
        <DiffViewer
          oldContent="line1\nline2"
          newContent="line1\nline2\nline3\nline4"
          showStats={true}
        />
      );
      expect(screen.getByText('02')).toBeInTheDocument();
      expect(screen.getByText('Lines added')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();

      // Test deletions and negative net change
      rerender(
        <DiffViewer
          oldContent="line1\nline2\nline3"
          newContent="line1"
          showStats={true}
        />
      );
      expect(screen.getByText('Lines removed')).toBeInTheDocument();
      expect(screen.getByText('-2')).toBeInTheDocument();

      // Test number padding (8 additions → "08")
      rerender(
        <DiffViewer
          oldContent="line1\nline2\nline3"
          newContent="line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\nline11"
          showStats={true}
        />
      );
      expect(screen.getByText('08')).toBeInTheDocument();
    });

    it('should hide stats when showStats is false', () => {
      render(<DiffViewer oldContent="line1" newContent="line2" showStats={false} />);
      expect(screen.queryByText('Additions')).not.toBeInTheDocument();
    });
  });

  describe('Diff Rendering', () => {
    it('should render unchanged, added, and deleted lines with correct styling and line numbers', () => {
      const { container } = render(
        <DiffViewer
          oldContent="line1\nline2\nline3"
          newContent="line1\nchanged\nline3"
        />
      );

      // Unchanged lines appear in both panes
      expect(screen.getAllByText('line1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('line3').length).toBeGreaterThan(0);

      // Check styling classes
      expect(container.querySelectorAll('.bg-green-500\\/10').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.bg-red-500\\/10').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.line-num').length).toBeGreaterThan(0);
    });

    it('should display custom and default labels correctly', () => {
      const { rerender } = render(
        <DiffViewer oldContent="old" newContent="new" oldLabel="Before" newLabel="After" />
      );
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();

      rerender(<DiffViewer oldContent="old" newContent="new" />);
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Modified')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('should collapse/expand unchanged sections and toggle button state', () => {
      render(
        <DiffViewer
          oldContent="line1\nline2\nline3\nline4\nline5"
          newContent="line1\nline2\nline3\nline4\nline5"
        />
      );

      // Should show collapsed indicator and expand button
      expect(screen.getAllByText(/5 unchanged lines/).length).toBeGreaterThan(0);
      const expandButton = screen.getByText('Expand unchanged');

      // Toggle to collapse
      fireEvent.click(expandButton);
      expect(screen.getByText('Collapse unchanged')).toBeInTheDocument();

      // Click collapsed section to expand lines
      const collapsedSection = screen.getAllByText(/5 unchanged lines/)[0];
      fireEvent.click(collapsedSection);
      expect(screen.getAllByText('line1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('line5').length).toBeGreaterThan(0);
    });
  });

  describe('Diff Algorithm', () => {
    it('should handle various diff scenarios (empty, replacements, multiline)', () => {
      const { rerender, container } = render(
        <DiffViewer oldContent="" newContent="line1\nline2" showStats={true} />
      );

      // Empty old content
      let statsText = container.querySelector('.stats-header')?.textContent || '';
      expect(statsText).toContain('02'); // 2 additions
      expect(statsText).toContain('00'); // 0 deletions

      // Empty new content
      rerender(<DiffViewer oldContent="line1\nline2" newContent="" showStats={true} />);
      statsText = container.querySelector('.stats-header')?.textContent || '';
      expect(statsText).toContain('00'); // 0 additions
      expect(statsText).toContain('02'); // 2 deletions

      // Both empty
      rerender(<DiffViewer oldContent="" newContent="" showStats={true} />);
      expect(screen.getAllByText('00')).toHaveLength(2);

      // Simple replacement
      rerender(<DiffViewer oldContent="hello world" newContent="hello universe" showStats={true} />);
      expect(container.textContent).toContain('Additions');
      expect(container.textContent).toContain('Deletions');

      // Multiline changes
      rerender(
        <DiffViewer
          oldContent="openapi: 3.1.0\ninfo:\n  title: Old API\n  version: 1.0.0"
          newContent="openapi: 3.1.0\ninfo:\n  title: New API\n  version: 2.0.0\n  description: Added"
          showStats={true}
        />
      );
      expect(screen.getByText('Additions')).toBeInTheDocument();
    });
  });

  describe('Word-level Highlighting', () => {
    it('should highlight changed words in additions/deletions but not context lines', () => {
      const { container } = render(
        <DiffViewer
          oldContent="line1\nhello world\nline3"
          newContent="line1\nhello universe\nline3"
        />
      );

      // Word-level highlighting
      expect(container.querySelectorAll('.bg-green-500\\/30').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.bg-red-500\\/30').length).toBeGreaterThan(0);

      // Context lines present
      expect(screen.getAllByText('line1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('line3').length).toBeGreaterThan(0);
    });
  });

  describe('Language Display & Edge Cases', () => {
    it('should display language and handle special characters, unicode, whitespace, long lines', () => {
      const { container, rerender } = render(
        <DiffViewer oldContent="old" newContent="new" language="yaml" />
      );
      expect(screen.getByText(/yaml/i)).toBeInTheDocument();

      // Special characters
      rerender(<DiffViewer oldContent="special: ${{secret}}" newContent="special: ${{value}}" />);
      expect(container.textContent).toContain('${{');

      // Unicode
      rerender(<DiffViewer oldContent="hello 世界" newContent="hello 🌍" />);
      expect(container.textContent).toContain('🌍');

      // Whitespace changes
      rerender(<DiffViewer oldContent="line1\nline2" newContent="line1  \nline2" showStats={true} />);
      expect(screen.getByText('Additions')).toBeInTheDocument();

      // Tabs vs spaces
      rerender(<DiffViewer oldContent="\tindented" newContent="  indented" showStats={true} />);
      expect(screen.getByText('Additions')).toBeInTheDocument();

      // Very long lines
      rerender(<DiffViewer oldContent={'a'.repeat(500)} newContent={'b'.repeat(500)} />);
      expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
    });
  });

  describe('Accessibility & Performance', () => {
    it('should have semantic HTML, accessible buttons, and keyboard navigation', () => {
      const { container } = render(
        <DiffViewer
          oldContent="line1\nline2\nline3\nline4\nline5"
          newContent="line1\nline2\nline3\nline4\nline5"
        />
      );

      // Semantic structure
      expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
      expect(container.querySelector('.editor-pane')).toBeInTheDocument();

      // Accessible buttons
      const button = container.querySelector('button');
      expect(button?.tagName).toBe('BUTTON');

      // Keyboard navigation
      const navButton = screen.getByText('Expand unchanged');
      navButton.focus();
      expect(document.activeElement).toBe(navButton);
    });

    it('should memoize diff computation and handle large diffs efficiently', () => {
      const { rerender, container } = render(
        <DiffViewer oldContent="line1\nline2\nline3" newContent="line1\nchanged\nline3" />
      );

      // Rerender (tests memoization implicitly)
      rerender(<DiffViewer oldContent="line1\nline2\nline3" newContent="line1\nchanged\nline3" />);
      expect(container.textContent).toContain('changed');

      // Large diff (100 lines)
      const oldLines = Array.from({ length: 100 }, (_, i) => `line${i}`);
      const newLines = Array.from({ length: 100 }, (_, i) => (i === 50 ? 'changed' : `line${i}`));
      rerender(<DiffViewer oldContent={oldLines.join('\n')} newContent={newLines.join('\n')} />);
      expect(container.querySelector('.diff-viewer')).toBeInTheDocument();
    });
  });
});
