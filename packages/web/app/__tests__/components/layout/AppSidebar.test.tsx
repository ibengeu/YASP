import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppSidebar } from '@yasp/core/components/layout/AppSidebar';

// Mock workspace store
vi.mock('@yasp/core/stores/workspace-store', () => ({
  useWorkspaceStore: () => ({
    workspaces: [
      { id: 'ws-1', name: 'Personal', isDefault: true, specIds: [] },
      { id: 'ws-2', name: 'Team Alpha', isDefault: false, specIds: [] },
    ],
    activeWorkspaceId: 'ws-1',
    setActiveWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
  }),
}));

// Mock idb-storage
vi.mock('@yasp/core/core/storage/idb-storage', () => ({
  idbStorage: {
    getFavoriteSpecIds: vi.fn().mockResolvedValue([]),
    getSpec: vi.fn().mockResolvedValue(null),
  },
}));

// Mock constants
vi.mock('@yasp/core/lib/constants', () => ({
  DEFAULT_USER_PROFILE: { initials: 'YS', name: 'YASP User', subtitle: 'Local Environment' },
}));

// Mock action-tracker
vi.mock('@yasp/core/lib/action-tracker', () => ({
  hasLeadEmail: vi.fn().mockReturnValue(false),
  markEmailCaptured: vi.fn(),
}));

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <AppSidebar
        onOpenCommandPalette={vi.fn()}
        onSelectSpec={vi.fn()}
        onNavigate={vi.fn()}
        activeView="workbench"
        {...props}
      />
    </MemoryRouter>
  );
}

describe('AppSidebar', () => {
  it('should render workspace name', () => {
    renderSidebar();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('should render nav items: Search, Workbench, Collections', () => {
    renderSidebar();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Workbench')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('should not render Invite Team nav item', () => {
    renderSidebar();
    expect(screen.queryByText('Invite Team')).not.toBeInTheDocument();
  });

  it('should render user section with initials and name', () => {
    renderSidebar();
    expect(screen.getByText('YS')).toBeInTheDocument();
    expect(screen.getByText('YASP User')).toBeInTheDocument();
  });

  it('should call onOpenCommandPalette when Search is clicked', () => {
    const onOpenCommandPalette = vi.fn();
    renderSidebar({ onOpenCommandPalette });
    fireEvent.click(screen.getByText('Search'));
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('should call onNavigate with "collections" when Collections is clicked', () => {
    const onNavigate = vi.fn();
    renderSidebar({ onNavigate });
    fireEvent.click(screen.getByText('Collections'));
    expect(onNavigate).toHaveBeenCalledWith('collections');
  });

  it('should call onNavigate with "workbench" when Workbench is clicked', () => {
    const onNavigate = vi.fn();
    renderSidebar({ onNavigate });
    fireEvent.click(screen.getByText('Workbench'));
    expect(onNavigate).toHaveBeenCalledWith('workbench');
  });

  it('should render Favorites section heading', () => {
    renderSidebar();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('should render separator elements between sections', () => {
    const { container } = renderSidebar();
    const separators = container.querySelectorAll('[data-testid="sidebar-separator"]');
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });
});
