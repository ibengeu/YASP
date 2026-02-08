import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingActionBar } from '@/components/editor/FloatingActionBar';

describe('FloatingActionBar', () => {
  const defaultProps = {
    activeTab: 'editor' as const,
    isMaximized: false,
    isSaving: false,
    onTabChange: vi.fn(),
    onToggleMaximize: vi.fn(),
    onSave: vi.fn(),
    onTryItOut: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the primary action button in collapsed state', () => {
      render(<FloatingActionBar {...defaultProps} />);

      const button = screen.getByRole('button', { name: /save changes/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('w-14', 'h-14', 'rounded-full');
    });

    it('should show Try It Out icon when on docs tab', () => {
      render(<FloatingActionBar {...defaultProps} activeTab="docs" />);

      const button = screen.getByRole('button', { name: /try it out/i });
      expect(button).toBeInTheDocument();
    });

    it('should show Save icon when on editor tab', () => {
      render(<FloatingActionBar {...defaultProps} activeTab="editor" />);

      const button = screen.getByRole('button', { name: /save changes/i });
      expect(button).toBeInTheDocument();
    });

    it('should not render menu items when collapsed', () => {
      render(<FloatingActionBar {...defaultProps} />);

      expect(screen.queryByRole('menuitem', { name: /docs/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: /editor/i })).not.toBeInTheDocument();
    });
  });

  describe('Expansion', () => {
    it('should expand menu when primary button clicked while collapsed', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /switch to documentation/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /switch to editor/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /expand editor/i })).toBeInTheDocument();
      });
    });

    it('should update aria-expanded attribute when expanded', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      expect(primaryButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(primaryButton);

      await waitFor(() => {
        expect(primaryButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('Collapse', () => {
    it('should collapse menu when Escape key pressed', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /switch to documentation/i })).toBeInTheDocument();
      });

      // Collapse via Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: /switch to documentation/i })).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Actions', () => {
    it('should call onSave when Save menu item clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} activeTab="editor" />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(async () => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        await user.click(saveButton);
      });

      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it('should call onTryItOut when Try It Out menu item clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} activeTab="docs" />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /try it out/i });
      await user.click(primaryButton);

      await waitFor(async () => {
        const tryItOutButton = screen.getByRole('menuitem', { name: /try it out/i });
        await user.click(tryItOutButton);
      });

      expect(defaultProps.onTryItOut).toHaveBeenCalled();
    });

    it('should call onTabChange when Docs menu item clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(async () => {
        const docsButton = screen.getByRole('menuitem', { name: /switch to documentation/i });
        await user.click(docsButton);
      });

      expect(defaultProps.onTabChange).toHaveBeenCalledWith('docs');
    });

    it('should call onTabChange when Editor menu item clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} activeTab="docs" />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /try it out/i });
      await user.click(primaryButton);

      await waitFor(async () => {
        const editorButton = screen.getByRole('menuitem', { name: /switch to editor/i });
        await user.click(editorButton);
      });

      expect(defaultProps.onTabChange).toHaveBeenCalledWith('editor');
    });

    it('should call onToggleMaximize when maximize button clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(async () => {
        const maximizeButton = screen.getByRole('menuitem', { name: /expand editor/i });
        await user.click(maximizeButton);
      });

      expect(defaultProps.onToggleMaximize).toHaveBeenCalled();
    });

    it('should show Minimize text when already maximized', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} isMaximized={true} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /minimize editor/i })).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus first menu item on expand', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });
    });

    it('should navigate menu items with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });

      // Navigate down
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const docsButton = screen.getByRole('menuitem', { name: /switch to documentation/i });
        expect(docsButton).toHaveFocus();
      });
    });

    it('should navigate menu items with ArrowUp', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });

      // Navigate down twice
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Navigate up
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        const docsButton = screen.getByRole('menuitem', { name: /switch to documentation/i });
        expect(docsButton).toHaveFocus();
      });
    });

    it('should wrap focus to last item when ArrowUp on first item', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });

      // Navigate up from first item
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        const maximizeButton = screen.getByRole('menuitem', { name: /expand editor/i });
        expect(maximizeButton).toHaveFocus();
      });
    });

    it('should wrap focus to first item when ArrowDown on last item', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      // Expand
      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });

      // Navigate to last item (3 down presses)
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

      // Navigate down from last item
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const saveButton = screen.getByRole('menuitem', { name: /save changes/i });
        expect(saveButton).toHaveFocus();
      });
    });

    it('should return focus to primary button on collapse', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /save changes/i })).toBeInTheDocument();
      });

      // Collapse via Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(primaryButton).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on primary button', () => {
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      expect(primaryButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(primaryButton).toHaveAttribute('aria-controls', 'fab-menu');
      expect(primaryButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have proper ARIA attributes on menu container', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        const menu = document.getElementById('fab-menu');
        expect(menu).toHaveAttribute('role', 'menu');
        expect(menu).toHaveAttribute('aria-orientation', 'vertical');
      });
    });

    it('should have proper ARIA labels on menu items', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(primaryButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /switch to documentation/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /switch to editor/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /expand editor/i })).toBeInTheDocument();
      });
    });

    it('should have minimum touch target size', () => {
      render(<FloatingActionBar {...defaultProps} />);

      const primaryButton = screen.getByRole('button', { name: /save changes/i });
      expect(primaryButton).toHaveClass('w-14', 'h-14'); // 56px
    });
  });

  describe('Saving State', () => {
    it('should show loading state when saving', () => {
      render(<FloatingActionBar {...defaultProps} isSaving={true} activeTab="editor" />);

      const primaryButton = screen.getByRole('button', { name: /saving/i });
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton).toBeDisabled();
    });

    it('should not allow primary action when saving', async () => {
      const user = userEvent.setup();
      render(<FloatingActionBar {...defaultProps} isSaving={true} activeTab="editor" />);

      const primaryButton = screen.getByRole('button', { name: /saving/i });
      await user.click(primaryButton);

      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });
  });
});
